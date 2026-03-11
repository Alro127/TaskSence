# BÁO CÁO PHẢN BIỆN CODE - TaskSense
## (Góc nhìn Giảng viên Phản biện Khóa luận Tốt nghiệp)

> **Ngày review:** 2026-03-10
> **Phạm vi:** Toàn bộ source code Server (Spring Boot) + Client (React/TypeScript)
> **Mục tiêu:** Đánh giá tính production-ready, bảo mật, nghiệp vụ, và chất lượng code

---

## MỤC LỤC
1. [CRITICAL - Bảo mật](#1-critical---bảo-mật)
2. [CRITICAL - Nghiệp vụ & Tính toàn vẹn dữ liệu](#2-critical---nghiệp-vụ--tính-toàn-vẹn-dữ-liệu)
3. [HIGH - Hiệu năng & N+1 Query](#3-high---hiệu-năng--n1-query)
4. [HIGH - Thiếu Retry/Resilience cho Production](#4-high---thiếu-retryresilience-cho-production)
5. [MEDIUM - Client-side Issues](#5-medium---client-side-issues)
6. [MEDIUM - Code Quality & Maintenance](#6-medium---code-quality--maintenance)
7. [LOW - Testing & DevOps](#7-low---testing--devops)
8. [Tổng kết & Đề xuất Roadmap](#8-tổng-kết--đề-xuất-roadmap)

---

## 1. CRITICAL - Bảo mật

### 1.1. JWT Secret Key hardcode trong source code
**File:** `server/src/main/resources/application.yaml:65`
```yaml
security:
  jwt:
    secret: my-super-secret-key-which-is-very-long-123456
```
**Vấn đề:** Secret key nằm trực tiếp trong file config được commit lên Git. Bất kỳ ai truy cập repo đều có thể forge JWT token hợp lệ, chiếm toàn bộ tài khoản.

**Gợi ý:** Dùng environment variable: `secret: ${JWT_SECRET}`, không có giá trị default.

---

### 1.2. Token reset password bị leak ra log
**File:** `server/.../service/impl/AuthServiceImpl.java:188`
```java
System.out.println(rawToken); // ← LEAK RESET TOKEN TO STDOUT
```
**Vấn đề:** Raw token dùng để reset password bị in ra console. Trong production, log thường được lưu trữ tập trung (ELK, CloudWatch) → attacker đọc log = chiếm tài khoản.

**Gợi ý:** Xóa dòng này ngay lập tức.

---

### 1.3. OTP sinh bằng `Random` thay vì `SecureRandom`
**File:** `server/.../service/impl/AuthServiceImpl.java:140`
```java
String otp = String.valueOf(100000 + new Random().nextInt(900000));
```
**Vấn đề:** `java.util.Random` là PRNG (pseudo-random), có thể đoán được pattern nếu biết seed. Với OTP chỉ 6 chữ số + không có rate limit, attacker có thể brute-force.

**Gợi ý:**
- Thay bằng `new SecureRandom()`
- Thêm rate limit: max 5 lần verify OTP sai → lock 15 phút
- Thêm rate limit: max 3 lần gửi OTP/giờ/email

---

### 1.4. Không có Rate Limiting trên Auth Endpoints
**File:** `server/.../controller/AuthController.java`

Các endpoint sau không có bất kỳ rate limiting nào:
- `POST /auth/login/local` — brute-force password
- `POST /auth/register` — spam tạo tài khoản
- `POST /auth/verify-otp` — brute-force OTP (10^6 = 1 triệu combo, 6 chữ số)
- `POST /auth/forgot-password` — spam email

**Gợi ý:** Dùng `bucket4j-spring-boot-starter` hoặc Spring Cloud Gateway rate limiter. Ví dụ: 5 req/phút cho login, 3 req/phút cho forgot-password.

---

### 1.5. Không validate password strength
**File:** `server/.../dto/request/AuthRequest.java`
```java
@NonNull
private String password; // ← Chỉ check non-null, không check độ dài/phức tạp
```
**Vấn đề:** User có thể đặt password là `"1"` hoặc `""` (empty string). Không có kiểm tra:
- Độ dài tối thiểu (ít nhất 8 ký tự)
- Độ phức tạp (chữ hoa, chữ thường, số, ký tự đặc biệt)

**Gợi ý:** Thêm `@Size(min = 8)` + `@Pattern` hoặc dùng Passay library.

---

### 1.6. Google OAuth tạo user không cần xác thực, password rỗng
**File:** `server/.../service/impl/AuthServiceImpl.java:247-248`
```java
var accountEntity = UserEntity.builder()
    .email(email)
    .password("") // ← Empty password!
    .fullName(fullName)
    .avatarUrl(picture)
    .build();
```
**Vấn đề:**
- User Google được tạo với `password = ""` và `isActive` không được set (mặc định `true` trên entity field). Điều này khác flow register thông thường (cần OTP verify mới `isActive = true`).
- Nếu sau này user muốn login bằng email/password, họ có thể bị exploit vì password hash của `""` là hợp lệ.

**Gợi ý:**
- Set `isActive = true` tường minh
- Set password = null hoặc dùng cờ `authProvider` để phân biệt Google vs Local
- Không cho phép login local nếu account được tạo qua Google

---

### 1.7. Token lưu trong localStorage → XSS Attack
**File:** `client/src/features/auth/authSlice.ts:29-30`
```typescript
localStorage.setItem("accessToken", action.payload.accessToken);
localStorage.setItem("refreshToken", action.payload.refreshToken);
```
**Vấn đề:** `localStorage` có thể bị đọc bởi bất kỳ JavaScript nào chạy trên cùng origin. Nếu có XSS vulnerability (dù nhỏ), attacker steal được cả access + refresh token.

**Gợi ý:**
- Refresh token nên lưu trong **httpOnly cookie** (server set cookie)
- Access token có thể giữ trong memory (Redux state) vì nó short-lived
- Kết hợp CSRF token nếu dùng cookie

---

### 1.8. `markAsRead` không verify notification thuộc về user
**File:** `server/.../service/impl/NotificationServiceImpl.java:94-109`
```java
public void markAsRead(Long notificationId) {
    Long userId = securityService.getCurrentUserId();
    NotificationEntity notification = repository.findById(notificationId).orElseThrow();
    // ← Không check notification.getReceiver().getId().equals(userId) !
    if (notification.getReadAt() == null) {
        notification.setReadAt(OffsetDateTime.now());
        ...
```
**Vấn đề:** User A có thể mark notification của User B là đã đọc bằng cách gửi notificationId của B. Đây là **IDOR (Insecure Direct Object Reference)**.

**Gợi ý:** Thêm check: `if (!notification.getReceiver().getId().equals(userId)) throw new ForbiddenException(...)`.

---

## 2. CRITICAL - Nghiệp vụ & Tính toàn vẹn dữ liệu

### ~~2.1. `createWorkspace` KHÔNG có @Transactional~~ ✅ ĐÃ FIX
> Đã thêm `@Transactional` annotation cho method `createWorkspace` trong `WorkspaceServiceImpl`.

---

### ~~2.2. Soft delete cascade không xử lý~~ ✅ ĐÃ FIX
> Đã implement cascade soft-delete đầy đủ:
> - `deleteWorkspace`: cascade tasks → project members → projects → workspace members → invites → workspace
> - `deleteProject`: cascade tasks → project members → project
> - `deleteTask`: cascade subtasks → task

---

### ~~2.3. Remove workspace member không dọn project memberships~~ ✅ ĐÃ FIX
> Đã implement `projectMemberRepository.softDeleteByWorkspaceIdAndUserId(workspaceId, userId, now)` — cascade soft-delete project memberships khi remove workspace member.

---

### ~~2.4. `updateMemberRole` cho phép set OWNER nhưng logic chặn~~ ✅ ĐÃ FIX
> Đã thêm check: `if (newRole == WorkspaceRole.OWNER) throw new BadRequestException("Can not change current into Owner")`.

---

### ~~2.5. `register` không check email trùng trước khi tạo user~~ ✅ ĐÃ FIX
> Đã thêm `userRepository.existsByEmail(email)` check trước khi save, throw `BadRequestException("Email already exists")`.

---

### 2.6. Refresh token không rotate (Token Reuse Attack)
**File:** `server/.../service/impl/AuthServiceImpl.java:111-131`
```java
public AuthResponse refresh(TokenRequest request) {
    ...
    String newAccessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
    return AuthResponse.builder()
        .accessToken(newAccessToken)
        .refreshToken(request.getToken()) // ← TRẢ LẠI REFRESH TOKEN CŨ!
        .build();
}
```
**Vấn đề:** Refresh token không được rotate (tạo mới) sau mỗi lần sử dụng. Nếu refresh token bị steal:
- Attacker dùng refresh token → nhận access token mới
- User thật dùng refresh token → cũng nhận access token mới
- Cả hai cùng hoạt động vô thời hạn

**Gợi ý:** Mỗi lần refresh, tạo refresh token mới + xóa token cũ trong Redis + trả về token mới.

---

### 2.7. Thiếu validation nghiệp vụ ngày tháng
**File:** `server/.../dto/request/CreateTaskRequest.java` & `CreateProjectRequest.java`

Không có validation:
- `startDate` phải trước `dueDate`/`endDate`
- `dueDate` không được trong quá khứ (tùy nghiệp vụ)
- Project `endDate` phải sau `startDate`

**Gợi ý:** Thêm custom validator hoặc check trong service layer.

---

## 3. HIGH - Hiệu năng & N+1 Query

### ~~3.1. `SecurityServiceImpl.getCurrentUserId()` query DB mỗi lần gọi~~ ✅ ĐÃ FIX
> Đã dùng `@RequestScope` + cache instance variable `currentUser`. Trong cùng 1 request, `getCurrentUser()` chỉ query DB 1 lần duy nhất, các lần gọi sau trả về cached result.

---

### 3.2. `resolveAssignees` N+1 query pattern
**File:** `server/.../service/impl/TaskServiceImpl.java:75-89`
```java
for (Long assigneeId : assigneeIds) {
    UserEntity assignee = userRepository.findById(assigneeId)...;  // ← query 1
    projectMemberRepository.existsByProjectIdAndUserId(...)         // ← query 2
}
```
**Vấn đề:** N assignee = 2N queries. Với 10 assignees = 20 queries cho 1 request tạo/update task.

**Gợi ý:**
```java
List<UserEntity> users = userRepository.findAllById(assigneeIds); // 1 query
Set<Long> projectMemberIds = projectMemberRepository.findUserIdsByProjectId(projectId); // 1 query
// Validate in-memory
```

---

### 3.3. `isWorkspaceOwnerOfProject` chạy 2 queries mỗi lần check permission
**File:** `server/.../security/permission/PermissionChecker.java:139-145`
```java
private boolean isWorkspaceOwnerOfProject(Long projectId, Long userId) {
    return projectRepository.findById(projectId)              // query 1
        .flatMap(project -> workspaceMemberRepository
            .findByWorkspaceIdAndUserId(..., userId))          // query 2
        ...
}
```
**Vấn đề:** Method này được gọi trong mọi project-level permission check. Kết hợp với 3.1, một request update task có thể chạy 10+ queries chỉ cho permission checking.

**Gợi ý:** Viết 1 query JOIN: `SELECT wm.role FROM workspace_members wm JOIN projects p ON ... WHERE p.id = ? AND wm.user_id = ?`

---

### 3.4. Thiếu pagination cho các list endpoint
| Endpoint | File | Vấn đề |
|----------|------|--------|
| `GET /workspaces` | `WorkspaceServiceImpl:66-73` | Trả về TẤT CẢ workspace, không paginate |
| `GET /projects/{id}/tasks` | `TaskServiceImpl:127-132` | Trả về TẤT CẢ task, không paginate |
| `GET /workspaces/{id}/members` | `WorkspaceMemberServiceImpl:42-51` | Trả về TẤT CẢ members |

**Vấn đề:** Workspace có 1000 members → 1 API call trả 1000 records. Task board có 500 tasks → load tất cả.

**Gợi ý:** Sử dụng `Pageable` của Spring Data với `Page<T>` response.

---

## 4. HIGH - Thiếu Retry/Resilience cho Production

### 4.1. Email gửi thất bại = mất vĩnh viễn
**File:** `server/.../service/subcriber/EmailSubscriber.java:46-48`
```java
} catch (Exception e) {
    System.err.println("Failed to process email message: " + e.getMessage());
    // ← Email bị nuốt, không retry, không DLQ!
}
```
**Vấn đề:** Nếu SMTP server tạm thời unavailable:
- OTP email không gửi được → user không thể verify → stuck
- Workspace invite email mất → user không nhận được invite
- Reset password email mất → user không thể reset

**Gợi ý:**
- Sử dụng Dead Letter Queue (DLQ) pattern: nếu gửi fail → đẩy vào Redis queue riêng
- Dùng `@Retryable` (Spring Retry) với exponential backoff: retry 3 lần, delay 1s, 2s, 4s
- Log error đúng cách (dùng logger, không `System.err`)

---

### 4.2. Redis Pub/Sub không đảm bảo delivery
**File:** `server/.../service/publisher/EmailPublisher.java`

**Vấn đề:** Redis Pub/Sub là **fire-and-forget**:
- Nếu subscriber offline khi message publish → message mất
- Nếu Redis restart → tất cả message đang xử lý mất
- Không có acknowledgment mechanism

**Gợi ý:**
- Dùng **Redis Streams** (có consumer groups, acknowledgment) thay vì Pub/Sub
- Hoặc dùng message broker chuyên dụng: RabbitMQ (đã có Spring support tốt)
- Ít nhất thêm fallback: ghi DB trước, pub/sub sau, có scheduled job retry

---

### 4.3. Không có Circuit Breaker cho external services
**Vấn đề:** Các external service calls không có protection:
- Google OAuth API (`getGoogleUserProfile`) — nếu Google API chậm/down → thread bị block vô thời hạn
- SMTP email sending — nếu SMTP chậm → thread pool cạn kiệt
- AWS S3 presigned URL generation

**Gợi ý:** Dùng Resilience4j:
```java
@CircuitBreaker(name = "googleAuth", fallbackMethod = "googleAuthFallback")
@TimeLimiter(name = "googleAuth")
```

---

### 4.4. Không có timeout configuration cho Redis
**File:** `server/src/main/resources/application.yaml:33`
```yaml
redis:
  host: localhost
  port: 6379
  timeout: 60000  # ← 60 giây quá dài
```
**Vấn đề:** Nếu Redis unavailable, mỗi request sẽ block 60 giây trước khi timeout. Với nhiều request đồng thời → thread pool cạn kiệt → toàn bộ server treo.

**Gợi ý:** Giảm timeout xuống 3-5 giây. Thêm connection pool config (lettuce).

---

## 5. MEDIUM - Client-side Issues

### 5.1. KHÔNG có Token Refresh Interceptor
**File:** `client/src/features/workspace/api/workspaceApi.ts` (và tất cả các API files khác)
```typescript
baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
}),
// ← Không có xử lý khi access token hết hạn!
```
**Vấn đề:** Khi access token expire:
1. API call trả 401
2. Client **không tự động** gọi `/auth/refresh` để lấy token mới
3. User bị redirect về login page → mất toàn bộ work đang làm

**Gợi ý:** Dùng RTK Query `baseQueryWithReauth` pattern:
```typescript
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const refreshResult = await baseQuery({url: '/auth/refresh', method: 'POST', body: {token: refreshToken}}, api, extraOptions);
    if (refreshResult.data) {
      api.dispatch(setCredentials(refreshResult.data));
      result = await baseQuery(args, api, extraOptions); // retry
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};
```

---

### 5.2. Mỗi feature tạo riêng `createApi` — vi phạm DRY
**Files:**
- `client/src/features/auth/api/authApi.ts` — `createApi` với `baseQuery` riêng
- `client/src/features/workspace/api/workspaceApi.ts` — `createApi` với `baseQuery` riêng
- `client/src/features/project/api/projectApi.ts` — tương tự
- `client/src/features/task/api/taskApi.ts` — tương tự
- ... (mỗi feature 1 api file riêng)

**Vấn đề:**
- `baseUrl` config bị duplicate ~10 lần
- Auth header logic duplicate ~8 lần
- Không thể thêm global interceptor (token refresh) ở 1 chỗ
- Nếu cần đổi base URL hoặc thêm header → sửa tất cả files

**Gợi ý:** Tạo shared `baseQueryWithAuth` trong file chung, import ở tất cả api files. Hoặc gom thành 1 `createApi` duy nhất dùng `injectEndpoints`.

---

### 5.3. Route guard chỉ check localStorage
**File:** `client/src/layouts/MainLayout.tsx:70-72`
```typescript
if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
}
```
`isAuthenticated` được khởi tạo từ:
```typescript
isAuthenticated: !!localStorage.getItem("accessToken"), // authSlice.ts:13
```

**Vấn đề:** Chỉ check access token có tồn tại trong localStorage hay không. Token có thể:
- Đã expire
- Bị tamper
- Là token của session cũ

**Gợi ý:** Validate token expiry client-side (decode JWT, check `exp` claim) hoặc gọi API verify khi app init.

---

### ~~5.4. Wildcard redirect khi route không tồn tại~~ ✅ ĐÃ FIX
> Đã thay `<Navigate to="/auth/login">` bằng `<NotFoundPage />` cho route `*`.

---

## 6. MEDIUM - Code Quality & Maintenance

### 6.1. `System.out.println` thay vì Logger (7 chỗ)
| File | Dòng | Nội dung |
|------|------|----------|
| `AuthServiceImpl.java` | 188 | In raw reset token ← **SECURITY RISK** |
| `NotificationServiceImpl.java` | 86 | In unread count |
| `NotificationServiceImpl.java` | 160 | In "Receiver is null" |
| `NotificationController.java` | 129 | In user principal |
| `EmailSubscriber.java` | 25 | In "received message" |
| `SocketSubscriber.java` | 24 | In "received message" |

**Gợi ý:** Thay tất cả bằng SLF4J Logger (`@Slf4j` annotation từ Lombok, đã có trên SocketSubscriber).

---

### 6.2. Typo trong code
| Vị trí | Sai | Đúng |
|--------|-----|------|
| Package name | `service.subcriber` | `service.subscriber` |
| Method name | `saveAndPublic()` | `saveAndPublish()` |
| Error message | `"Workspace have only one owner"` | `"Workspace can have only one owner"` |

---

### ~~6.3. Email template sai nội dung~~ ✅ ĐÃ FIX
> Email workspace invite đã được sửa: hiển thị đúng "Workspace Invitation" thay vì "Password Reset Request".

---

### ~~6.4. Frontend URL sai trong config~~ ✅ ĐÃ FIX
> Đã sửa `http:/localhost:5173` → `http://localhost:5173`.

---

### ~~6.5. Mix `jakarta.transaction` và `spring.transaction`~~ ✅ ĐÃ FIX
> Tất cả service đã thống nhất dùng `org.springframework.transaction.annotation.Transactional`.

---

## 7. LOW - Testing & DevOps

### 7.1. Chỉ có 1 test file — `contextLoads()`
**File:** `server/src/test/.../TaskSenseApplicationTests.java`
```java
@Test
void contextLoads() { }  // ← Test duy nhất trong toàn bộ project
```
**Vấn đề cho phản biện:** Không có unit test, integration test, hay API test. Giảng viên phản biện chắc chắn sẽ hỏi:
> *"Làm sao bạn đảm bảo code hoạt động đúng khi không có test nào?"*

**Gợi ý tối thiểu cho khóa luận:**
- Unit test cho `PermissionPolicy` (matrix permission đúng chưa)
- Unit test cho `AuthServiceImpl` (register, login, OTP flow)
- Integration test cho TaskController (CRUD + permission check)
- Ít nhất đạt 30-40% code coverage cho các service chính

---

### 7.2. Swagger UI enabled mà không phân biệt environment
**File:** `application.yaml:80-90`
```yaml
springdoc:
  swagger-ui:
    enabled: true
    try-it-out-enabled: true
```
**Vấn đề:** Nếu deploy production → bất kỳ ai cũng xem được toàn bộ API schema, thử API trực tiếp.

**Gợi ý:** Tạo `application-prod.yaml` với `springdoc.swagger-ui.enabled: false`.

---

### 7.3. Thiếu request/response logging và audit trail
**Vấn đề:** Không có:
- Request/response logging filter
- Audit trail cho các hành động nhạy cảm (delete workspace, remove member, change role)
- Correlation ID cho distributed tracing

**Gợi ý:** Thêm `CommonsRequestLoggingFilter` hoặc custom filter. Ghi audit log cho các mutation operations.

---

### 7.4. Chỉ 1 profile, không phân biệt dev/staging/prod
Chỉ có 1 file `application.yaml` dùng cho mọi environment. Production cần:
- Tắt debug logging
- Tắt swagger
- Bắt buộc HTTPS
- SSL cho Redis, PostgreSQL
- Separate connection pool config

---

## 8. Tổng kết & Đề xuất Roadmap

### Ma trận đánh giá

| Tiêu chí | Điểm (1-10) | Ghi chú |
|-----------|:-----------:|---------|
| **Kiến trúc tổng thể** | 7 | Clean architecture, phân layer rõ ràng, permission policy tập trung |
| **Bảo mật** | 4 | Nhiều lỗ hổng critical (hardcoded secret, no rate limit, IDOR) |
| **Tính toàn vẹn dữ liệu** | 7.5 | Đã fix @Transactional, cascade soft-delete, email check, remove member cascade project memberships |
| **Hiệu năng** | 6 | Đã fix getCurrentUser() caching (@RequestScope). Còn: N+1 queries, thiếu pagination |
| **Resilience/Production** | 3 | Không retry, không circuit breaker, fire-and-forget messaging |
| **Testing** | 1 | Chỉ có contextLoads() |
| **Code Quality** | 7 | Đã fix email template, frontend-url, thống nhất @Transactional import. Còn: typo, System.out |
| **Client Architecture** | 6.5 | Đã fix 404 page. Còn: thiếu token refresh, DRY violation |

### Roadmap ưu tiên sửa

#### Giai đoạn 1: Sửa CRITICAL trước bảo vệ (1-2 ngày)
- [ ] Xóa hardcoded JWT secret → dùng env variable
- [ ] Xóa `System.out.println(rawToken)`
- [x] Thêm `@Transactional` cho `createWorkspace`
- [ ] Fix `markAsRead` IDOR vulnerability
- [x] Fix email template copy-paste bug
- [x] Fix `updateMemberRole` cho phép set OWNER
- [ ] Dùng `SecureRandom` cho OTP
- [x] Thêm check email trùng trước khi register
- [x] Fix frontend-url typo trong application.yaml

#### Giai đoạn 2: Cải thiện trải nghiệm (3-5 ngày)
- [ ] Implement token refresh interceptor trên client
- [ ] Thêm rate limiting cho auth endpoints
- [x] Implement cascade soft-delete (workspace → projects → tasks)
- [x] Uncomment project member cleanup khi remove workspace member
- [ ] Thêm pagination cho list endpoints
- [ ] Tạo shared `baseQueryWithAuth` cho client API
- [ ] Validate password strength
- [ ] Refresh token rotation

#### Giai đoạn 3: Production-ready (5-7 ngày)
- [ ] Viết unit tests cho services chính
- [ ] Thêm Spring Retry cho email sending
- [ ] Replace Redis Pub/Sub bằng Streams hoặc RabbitMQ
- [ ] Profile separation (dev/staging/prod)
- [ ] Tắt Swagger cho production
- [ ] Thêm request logging + audit trail
- [ ] Optimize N+1 queries
- [ ] Add circuit breaker cho external services

---

> **Ghi chú:** Báo cáo này tập trung vào các vấn đề có thể bị giảng viên phản biện đặt câu hỏi. Kiến trúc tổng thể của project khá tốt (clean architecture, permission matrix tập trung, Redis caching, WebSocket realtime). Các vấn đề trên chủ yếu là chi tiết implementation cần hoàn thiện cho production-ready.

---

## 9. CÂU HỎI PHẢN BIỆN DỰ KIẾN & GỢI Ý TRẢ LỜI

> Phần này mô phỏng các câu hỏi mà giảng viên phản biện **rất có khả năng** sẽ đặt ra trong buổi bảo vệ khóa luận. Mỗi câu hỏi kèm phân tích điểm yếu hiện tại và gợi ý cách trả lời/cải thiện.

---

### 9.1. NHÓM CÂU HỎI: TÍNH MỚI & ĐÓNG GÓP KHOA HỌC

#### Q1: "TaskSense khác gì so với Jira, Trello, Asana, ClickUp? Tại sao người dùng nên chọn TaskSense thay vì các công cụ đã có trên thị trường?"

**Phân tích thực tế:**
Hiện tại, TaskSense cung cấp các tính năng **gần như là subset** của Jira/Trello:
- Kanban board ✅ (Trello có từ 2011)
- Task CRUD với priority/status ✅ (mọi tool đều có)
- Workspace/Project hierarchy ✅ (Jira có)
- Real-time notification ✅ (Jira, Asana đều có)
- Permission system ✅ (Jira có RBAC phức tạp hơn nhiều)

**Những gì TaskSense THIẾU so với Jira/Trello:**
| Tính năng | Jira | Trello | Asana | TaskSense |
|-----------|------|--------|-------|-----------|
| Sprint/Scrum board | ✅ | ❌ | ❌ | ❌ |
| Burndown chart | ✅ | ❌ | ❌ | ❌ |
| Time tracking | ✅ | ✅ (Power-Up) | ✅ | ❌ |
| Gantt chart | ✅ | ❌ | ✅ (Timeline) | ❌ |
| Custom fields | ✅ | ✅ | ✅ | ❌ |
| Automation rules | ✅ | ✅ (Butler) | ✅ | ❌ |
| Integration (Slack, GitHub) | ✅ | ✅ | ✅ | ❌ |
| Reporting/Analytics | ✅ | ❌ | ✅ | ❌ (placeholder) |
| Calendar view | ✅ | ✅ | ✅ | ❌ (placeholder) |
| Mobile app | ✅ | ✅ | ✅ | ❌ |
| Workflow customization | ✅ | ❌ | ✅ | ❌ (cố định 4 status) |
| Labels/Tags | ✅ | ✅ | ✅ | ❌ |
| Comments trên task | ✅ | ✅ | ✅ | ❌ |
| Activity log/History | ✅ | ✅ | ✅ | ❌ |
| File attachment | ✅ | ✅ | ✅ | ❌ (có S3 nhưng chưa attach vào task) |
| Public workspace explore | ❌ | ❌ | ❌ | ✅ |
| Team templates | ❌ | ❌ | ✅ (project template) | ✅ |
| User skill profiles | ❌ | ❌ | ❌ | ✅ |

**Gợi ý trả lời:**
- Nhấn mạnh **public workspace discovery** (Jira/Trello không có concept này — chúng là tool nội bộ, không có khám phá cộng đồng)
- Nhấn mạnh **user skill profiles** — đây là tính năng hướng tới việc match task với người có kỹ năng phù hợp (cần phát triển thêm)
- Nhấn mạnh **team templates** — tái sử dụng cấu trúc team giữa các project
- Thừa nhận giới hạn: TaskSense là **MVP (Minimum Viable Product)** cho khóa luận, tập trung vào kiến trúc backend vững chắc (Outbox pattern, RBAC, WebSocket) hơn là nhiều tính năng

---

#### Q2: "Tên dự án là 'TaskSense' — 'Sense' ở đây nghĩa là gì? Có tính năng AI/ML nào liên quan đến 'sensing' hay 'intelligent' không?"

**Phân tích thực tế:**
- Project tên **TaskSense** gợi ý khả năng "cảm nhận", "thông minh", "dự đoán" liên quan đến task
- **THỰC TẾ: Không có bất kỳ tính năng AI/ML nào** trong toàn bộ codebase
- Không có prediction, recommendation, auto-assignment, smart scheduling
- Route `/analytics` chỉ là placeholder
- ElasticSearch được thêm vào dependency nhưng **chỉ dùng cho full-text search cơ bản**, không có NLP hay semantic search

**Đây là câu hỏi RẤT KHÓ trả lời** nếu không có kế hoạch AI rõ ràng.

**Gợi ý trả lời:**
- Giải thích "Sense" theo nghĩa "nhận biết ngữ cảnh" (context-aware): hệ thống nhận biết role, permission, workspace context để hiển thị thông tin phù hợp
- Nếu có thời gian, implement ít nhất 1 tính năng "smart":
  - **Smart task assignment**: dựa vào `UserSkill` → suggest assignee phù hợp nhất cho task (đã có data model `UserSkillEntity`)
  - **Task priority suggestion**: phân tích deadline, workload hiện tại → suggest priority
  - **Overdue prediction**: dự đoán task nào có khả năng trễ deadline dựa vào lịch sử hoàn thành

---

#### Q3: "Đóng góp mới (contribution) của khóa luận này là gì? Nếu chỉ là xây dựng lại một công cụ quản lý task thì giá trị học thuật nằm ở đâu?"

**Phân tích:**
Đây là câu hỏi **sống còn** của khóa luận. Giảng viên muốn biết: "Bạn đã HỌC và ÁP DỤNG được gì mới?"

**Gợi ý trả lời — nhấn mạnh các điểm kiến trúc:**
1. **Outbox Pattern** — giải quyết bài toán consistency giữa DB transaction và message publishing (distributed systems)
2. **Hierarchical RBAC** — hệ thống phân quyền 2 cấp (workspace role + project role) với permission matrix tập trung
3. **Event-Driven Architecture** — Redis Pub/Sub cho real-time notification pipeline
4. **WebSocket Authentication** — JWT auth trên STOMP protocol (không trivial)
5. **Presigned URL pattern** — client upload trực tiếp lên S3, giảm tải server

---

### 9.2. NHÓM CÂU HỎI: KIẾN TRÚC & THIẾT KẾ

#### Q4: "Tại sao chọn Redis Pub/Sub mà không dùng RabbitMQ hoặc Kafka? Bạn có biết Redis Pub/Sub không đảm bảo message delivery không?"

**Phân tích:**
- Redis Pub/Sub là **fire-and-forget**: nếu subscriber offline → message mất
- Đã có Outbox Pattern để bù đắp, NHƯNG outbox chỉ áp dụng cho notification, email thì gửi trực tiếp qua pub/sub
- Nếu EmailSubscriber crash khi nhận message → email mất vĩnh viễn (không retry từ outbox)

**Gợi ý trả lời:**
- Thừa nhận trade-off: Redis Pub/Sub đơn giản hơn, phù hợp MVP
- Outbox Pattern đã bù đắp 1 phần (notification events có retry)
- Production nên dùng Redis Streams (có acknowledgment) hoặc RabbitMQ
- Lý do chọn Redis: đã dùng Redis cho token storage → tận dụng infrastructure sẵn có, giảm complexity

---

#### Q5: "Outbox Pattern của bạn xử lý idempotency như thế nào? Nếu OutboxWorker crash giữa chừng (đã publish lên Redis nhưng chưa update status), notification có bị gửi 2 lần không?"

**Phân tích thực tế:**
```java
// OutboxEventProcessor.java
notificationPublisher.publish(notificationMessage);  // ← step 1: publish
event.setDeliveryStatus(DeliveryStatus.SUCCESS);      // ← step 2: update status
outboxEventRepository.save(event);                     // ← step 3: save to DB
```
- Nếu crash giữa step 1 và step 3 → event vẫn PENDING → worker sẽ publish LẠI → **duplicate notification**
- Không có deduplication mechanism ở consumer side
- Không có unique event ID check trước khi gửi WebSocket

**Gợi ý trả lời:**
- Thừa nhận: hiện tại là **at-least-once delivery**, chưa phải exactly-once
- Notification bị duplicate không gây hại nghiêm trọng (hiển thị 2 lần thay vì 1)
- Để đạt exactly-once: consumer cần track processed event IDs (idempotency key)

---

#### Q6: "ElasticSearch được thêm vào dependency nhưng dùng để làm gì? Tại sao không dùng PostgreSQL full-text search (tsvector/tsquery) cho đơn giản?"

**Phân tích:**
- `spring-boot-starter-data-elasticsearch` có trong pom.xml
- Nhưng sau khi review code, **TaskRepository dùng native SQL query trên PostgreSQL** cho task search:
```java
@Query(value = "SELECT t.* FROM tasks t ...", nativeQuery = true)
```
- Không tìm thấy ElasticSearch repository hoặc document class nào
- **ElasticSearch có thể chưa được sử dụng hoặc mới ở giai đoạn tích hợp ban đầu**

**Gợi ý trả lời:**
- Nếu chưa dùng: thừa nhận đây là planned feature, chưa implement
- Nếu dùng: giải thích use case cụ thể (full-text search trên task title/description với tiếng Việt)
- So sánh: PostgreSQL FTS đủ cho 10K-100K records; ElasticSearch cần thiết khi >1M records hoặc cần fuzzy search, tiếng Việt tokenization

---

#### Q7: "Tại sao dùng Spring Boot 4.0.3? Phiên bản stable mới nhất là bao nhiêu? Bạn có gặp vấn đề compatibility không?"

**Phân tích:**
- Spring Boot 4.0.x là phiên bản **rất mới** (nếu tồn tại tại thời điểm làm thesis)
- Cần confirm: đây có thực sự là Spring Boot 4.0.3 hay là typo trong pom.xml?
- Spring Boot 3.x (với Jakarta EE 9+) mới là dòng phổ biến nhất
- Dùng version mới nhất có thể gây thiếu tài liệu, community support

**Gợi ý:** Kiểm tra lại version trong pom.xml, chuẩn bị giải thích lý do chọn version.

---

#### Q8: "Giải thích flow xác thực (authentication flow) từ đầu đến cuối. Tại sao CSRF bị tắt? Có an toàn không?"

**Gợi ý trả lời:**
1. Client gửi POST `/auth/login/local` với email/password
2. Server validate → generate access token + refresh token (JWT, HS256)
3. Client lưu token vào localStorage (⚠️ nên nói đã biết rủi ro XSS)
4. Mỗi request: client gửi `Authorization: Bearer {token}`
5. `JwtAuthenticationFilter` validate token, set `SecurityContext`
6. CSRF tắt vì: stateless REST API, không dùng cookie-based session → CSRF không áp dụng (CSRF chỉ exploit khi browser tự động gửi cookie)

---

#### Q9: "Hệ thống phân quyền 2 cấp (workspace + project) hoạt động thế nào? Nếu workspace OWNER vào project mà không phải member thì sao?"

**Phân tích:**
- `PermissionChecker` có logic: workspace OWNER có **implicit access** đến tất cả project trong workspace
- Method `isWorkspaceOwnerOfProject(projectId)` kiểm tra điều này
- Nhưng: OWNER không có `ProjectMemberEntity` → một số query join project_members sẽ không trả về OWNER

**Gợi ý trả lời:**
- Giải thích hierarchy: Workspace OWNER > Project MANAGER > Project MEMBER > Project VIEWER
- OWNER bypass project-level permission check thông qua `PermissionChecker`
- Thiết kế này cho phép OWNER quản lý mọi project mà không cần join từng project

---

### 9.3. NHÓM CÂU HỎI: HIỆU NĂNG & KHẢ NĂNG MỞ RỘNG

#### Q10: "Hệ thống có thể handle bao nhiêu concurrent users? Bạn đã test performance chưa?"

**Phân tích:**
- **Không có performance test** nào trong project
- Không có JMeter, Gatling, k6, hoặc bất kỳ load testing tool nào
- Không có benchmark data

**Các bottleneck tiềm ẩn:**
1. `getCurrentUserId()` query DB mỗi lần gọi (5 lần/request) → ~5 queries/request chỉ cho auth
2. N+1 query trong `resolveAssignees` → 2N queries cho N assignees
3. WebSocket connections: mỗi user giữ 1 persistent connection → server giữ tất cả connections in-memory
4. OutboxWorker xử lý synchronously → 100 events/10s = 10 events/s throughput tối đa
5. Redis Pub/Sub single-threaded → bottleneck nếu nhiều notifications

**Gợi ý trả lời:**
- Thừa nhận chưa có load test
- Ước tính: với architecture hiện tại, có thể handle ~100-500 concurrent users
- Để scale: cần optimize N+1 queries, cache userId, horizontal scaling WebSocket (cần sticky session hoặc Redis adapter)

---

#### Q11: "OutboxWorker chạy mỗi 10 giây, nghĩa là notification có thể delay tối đa 10 giây. Đây có phải real-time không?"

**Phân tích:**
- Đúng: notification delay = 0-10 giây (trung bình 5 giây)
- Gọi đây là "real-time" không chính xác → nên gọi là **"near real-time"**
- Jira/Trello/Asana thường deliver notification trong < 1 giây

**Gợi ý cải thiện:**
- Giảm `fixedDelay` xuống 1-2 giây
- Hoặc dùng **hybrid approach**: publish trực tiếp qua WebSocket (real-time) + save outbox event (durability backup)
- Outbox chỉ dùng cho retry failed events, không phải primary delivery path

---

#### Q12: "Task search dùng native SQL query. Tại sao không dùng Specification/Criteria API? Native query có vấn đề gì về maintainability?"

**Phân tích:**
- `TaskRepository` dùng `@Query(nativeQuery = true)` với raw SQL
- Raw SQL khó maintain, không type-safe, dễ SQL injection nếu không parameterized
- Spring Data JPA Specification pattern cho phép dynamic query building

**Gợi ý trả lời:**
- Native query cho performance tốt hơn với complex joins
- Đã dùng parameterized query (`:keyword`, `:status`) nên không có SQL injection
- Nhược điểm: nếu đổi DB (PostgreSQL → MySQL) thì phải viết lại
- Nên dùng Criteria API hoặc QueryDSL cho maintainability

---

### 9.4. NHÓM CÂU HỎI: CHỨC NĂNG THIẾU & PLACEHOLDER

#### Q13: "Route `/analytics`, `/calendar`, `/tasks` (My Tasks) đều là placeholder. Tại sao để chúng trong code?"

**Phân tích:**
- 3 route quan trọng chỉ hiển thị text placeholder
- Analytics là tính năng **rất quan trọng** cho task management tool (biết team đang hoạt động thế nào)
- Calendar view giúp visualize deadline
- "My Tasks" page (tổng hợp task từ tất cả project) là tính năng cơ bản

**Gợi ý trả lời:**
- Thừa nhận đây là roadmap features, chưa kịp implement trong scope khóa luận
- Nếu có thời gian, ưu tiên implement **"My Tasks"** vì nó đơn giản nhất (query all tasks where assignee = current user)

---

#### Q14: "Task không có comment/discussion. Đây là tính năng cốt lõi của collaboration tool. Tại sao thiếu?"

**Phân tích:**
- Notification type có `COMMENT_MENTION` → **đã plan nhưng chưa implement**
- Không có `CommentEntity`, `CommentController`, hay `CommentService`
- Collaboration tool MÀ không có discussion trên task → giảm giá trị sử dụng đáng kể

**Gợi ý:**
- Nếu có thời gian: implement basic comment system (text only, no rich text)
- Nếu không: thừa nhận là limitation, giải thích đã plan (COMMENT_MENTION notification type chứng minh)

---

#### Q15: "Task không có activity log/history. Làm sao biết ai đã thay đổi gì, khi nào?"

**Phân tích:**
- Không có audit trail cho task changes (status change, assignee change, title edit)
- Không có `TaskActivityEntity` hoặc event sourcing cho task
- Trong team collaboration, history rất quan trọng: "Ai đã chuyển task này sang DONE?"

**Gợi ý:**
- Đã có Outbox Event table → có thể dùng làm audit log (nhưng hiện tại chỉ lưu NOTIFICATION events)
- Mở rộng OutboxEventEntity để log tất cả task mutations

---

#### Q16: "Task status cố định 4 giá trị (TODO, IN_PROGRESS, REVIEW, DONE). Không cho phép customize workflow. Đây là hạn chế lớn so với Jira. Giải thích?"

**Phân tích:**
- Jira cho phép tạo custom status, custom workflow transitions
- TaskSense hardcode 4 status trong enum → không thể thêm "QA", "BLOCKED", "DEPLOYED"
- Đây là thiết kế **opinionated** (có ý kiến rõ ràng) — đơn giản nhưng thiếu linh hoạt

**Gợi ý trả lời:**
- Thiết kế đơn giản có chủ đích: giảm learning curve cho team nhỏ
- Trello ban đầu cũng không có custom status
- Production improvement: tạo `StatusEntity` riêng, cho phép project define custom statuses

---

### 9.5. NHÓM CÂU HỎI: BẢO MẬT NÂNG CAO

#### Q17: "Bạn xử lý CORS như thế nào? Hiện tại CORS configuration có vấn đề gì không?"

**Phân tích:**
```java
http.cors(Customizer.withDefaults()); // ← Dùng default CORS config
```
- Default CORS trong Spring Security: **cho phép tất cả origins** nếu không có `CorsConfigurationSource` bean
- Production cần restrict origin: chỉ cho phép `https://yourdomain.com`
- Hiện tại: mọi domain đều có thể gọi API → nguy cơ CSRF-like attacks

**Gợi ý:** Tạo `CorsConfigurationSource` bean, whitelist frontend URL.

---

#### Q18: "Refresh token lưu ở đâu? Khi user logout, token có bị invalidate không? Nếu token bị steal thì sao?"

**Phân tích:**
- Refresh token lưu ở client localStorage (XSS risk)
- Logout flow: unclear — cần check có blacklist token trong Redis không
- Refresh token KHÔNG rotate (trả lại token cũ khi refresh) → stolen token dùng mãi

**Gợi ý trả lời:**
- Giải thích token lifecycle: access token (short-lived) + refresh token (long-lived)
- Thừa nhận thiếu token rotation và đề xuất cải thiện
- Có TokenHasher + Redis storage → logout có thể blacklist token

---

### 9.6. NHÓM CÂU HỎI: TESTING & DEVOPS

#### Q19: "Toàn bộ project chỉ có 1 test `contextLoads()`. Làm sao bạn đảm bảo code hoạt động đúng?"

**Phân tích:**
- Đây là câu hỏi **chắc chắn sẽ bị hỏi**
- Không có unit test, integration test, E2E test
- Không có code coverage report
- PermissionPolicy (phần critical nhất) không có test → nếu sửa sai permission matrix thì không ai biết

**Gợi ý trả lời:**
- Đã test thủ công qua Swagger UI và Postman
- Thừa nhận thiếu automated test là hạn chế lớn
- Nếu có thời gian: viết ít nhất test cho PermissionPolicy, AuthService, TaskService
- Export Postman collection làm bằng chứng manual testing

---

#### Q20: "Bạn deploy hệ thống này như thế nào? Có CI/CD pipeline không? Có Dockerfile không?"

**Phân tích:**
- Có `compose.yaml` → Docker Compose cho local development
- Không thấy `Dockerfile` cho application
- Không có CI/CD config (`.github/workflows/`, Jenkinsfile, etc.)
- Không có deployment documentation

**Gợi ý trả lời:**
- Giải thích local development setup: Docker Compose cho PostgreSQL, Redis, ElasticSearch
- Application chạy trực tiếp bằng `./mvnw spring-boot:run`
- Production deployment: chưa setup (ngoài scope khóa luận)

---

### 9.7. NHÓM CÂU HỎI: NGHIỆP VỤ & UX

#### Q21: "Bạn đã nghiên cứu người dùng (user research) chưa? Có khảo sát nhu cầu thực tế không?"

**Phân tích:**
- Không có bằng chứng user research trong codebase
- Không có personas, user stories document
- Tính năng dựa trên giả định, chưa validate với user thực

**Gợi ý trả lời:**
- Nếu đã khảo sát: trình bày kết quả
- Nếu chưa: thừa nhận và nói đã tham khảo các tool hiện có (Jira, Trello) + kinh nghiệm cá nhân làm việc nhóm

---

#### Q22: "Workspace có concept 'public' (isPublic). Kịch bản sử dụng thực tế là gì? Ai sẽ tạo public workspace và tại sao?"

**Phân tích:**
- Public workspace + explore page + join request → mô hình giống "cộng đồng" hơn là "nội bộ công ty"
- Jira/Trello không có concept này vì chúng focus enterprise
- Đây có thể là **unique selling point** nếu articulate tốt

**Gợi ý trả lời:**
- Use case: open-source project management, student group collaboration, community task forces
- So sánh với GitHub organization (public repos, anyone can fork/contribute)
- TaskSense hướng tới **open collaboration**, khác với Jira (enterprise, closed)

---

#### Q23: "UserSkill entity có trong database nhưng không được dùng ở đâu ngoài profile. Mục đích thực sự là gì?"

**Phân tích:**
- `UserSkillEntity` lưu skill name + proficiency level (1-5)
- Không có logic nào dùng skill data để recommend assignee hoặc match task
- Đây là **dead feature** — có data nhưng không có business logic

**Gợi ý trả lời:**
- Planned feature: AI-powered task assignment dựa trên skill matching
- Hiện tại: cho phép team lead xem skill của members để assign task phù hợp (manual)
- Future: so sánh task requirements với member skills → auto-suggest assignee

---

#### Q24: "Soft delete dùng `deletedAt` nhưng không có restore/undo functionality. Vậy soft delete phục vụ mục đích gì?"

**Phân tích:**
- Soft delete pattern áp dụng cho Task, Workspace, Project, User
- `@SQLRestriction("deleted_at IS NULL")` filter tự động ở Hibernate level
- **Không có API endpoint nào để restore** item đã xóa
- Không có admin panel để xem/quản lý deleted items

**Gợi ý trả lời:**
- Mục đích chính: data integrity (không mất data vĩnh viễn), audit trail
- Compliance: GDPR-like requirements (keep data nhưng hide from users)
- Future: admin panel với restore functionality
- Thực tế: nếu không có restore UI thì soft delete chỉ là "delayed hard delete"

---

### 9.8. NHÓM CÂU HỎI: SO SÁNH CÔNG NGHỆ

#### Q25: "Tại sao chọn React + Redux Toolkit thay vì Next.js, Vue, Angular? So sánh ưu nhược điểm?"

**Gợi ý trả lời:**
- React: ecosystem lớn nhất, nhiều thư viện hỗ trợ, cộng đồng lớn
- Redux Toolkit + RTK Query: chuẩn hóa state management, built-in caching, tự động refetch
- Không chọn Next.js: TaskSense là SPA (Single Page Application), không cần SSR/SSG
- Không chọn Angular: learning curve cao hơn, codebase lớn hơn cho scope khóa luận

---

#### Q26: "Tại sao chọn Spring Boot + Java thay vì Node.js/NestJS, Django, Go?"

**Gợi ý trả lời:**
- Spring Boot: enterprise-standard, mature ecosystem (Security, Data JPA, WebSocket, Mail)
- Java 21: virtual threads, pattern matching, record types (modern features)
- Spring Security: built-in JWT, OAuth, RBAC support
- So với Node.js: type safety tốt hơn (compile-time), performance tốt hơn cho CPU-bound tasks
- So với Django: WebSocket support native hơn (Spring WebSocket vs Django Channels)

---

#### Q27: "Database design dùng auto-increment Long ID. Tại sao không dùng UUID? Có biết vấn đề security của sequential ID không?"

**Phân tích:**
- Sequential ID (`Long`) cho phép attacker enumerate resources: `GET /tasks/1`, `GET /tasks/2`, ...
- Kết hợp với IDOR vulnerability (đã phát hiện ở section 1.8) → nguy hiểm
- UUID ngẫu nhiên → không thể enumerate

**Gợi ý trả lời:**
- Auto-increment ID: performance tốt hơn cho indexing (B-tree friendly)
- Trade-off: đã có permission check ở tất cả endpoints → enumerate nhưng không access được
- UUID v7 (time-ordered) là best practice hiện đại: random + sortable

---

### 9.9. NHÓM CÂU HỎI: KHẢ NĂNG BẢO TRÌ & MỞ RỘNG

#### Q28: "Mỗi feature tạo 1 `createApi` riêng (RTK Query). Nếu cần thêm global interceptor (ví dụ token refresh), bạn phải sửa bao nhiêu file?"

**Phân tích:**
- Hiện tại: 8+ file API riêng biệt, mỗi file duplicate `baseQuery` config
- Thêm token refresh interceptor → sửa **tất cả** file API
- Đổi base URL → sửa tất cả file API
- Vi phạm DRY principle nghiêm trọng

**Gợi ý trả lời:**
- Thừa nhận đây là technical debt
- Plan refactor: tạo shared `baseQueryWithAuth` hoặc dùng `injectEndpoints` pattern

---

#### Q29: "Database migration dùng Flyway. Hiện có bao nhiêu migration files? Có migration cho seed data không?"

**Phân tích:**
- Flyway configured trong pom.xml
- Cần check: có bao nhiêu migration file trong `db/migration/`
- Có `seed_data.sql` → nhưng nó nằm ở `db/seed/`, không phải Flyway managed

**Gợi ý trả lời:**
- Giải thích Flyway: version-controlled database migrations
- Seed data tách riêng vì chỉ dùng cho development, không dùng cho production

---

#### Q30: "Nếu cần thêm tính năng 'Task Dependencies' (task A phải hoàn thành trước task B), bạn sẽ thiết kế như thế nào?"

**Gợi ý trả lời (đánh giá khả năng tư duy thiết kế):**
- Tạo `TaskDependencyEntity` (predecessor_id, successor_id, type: FINISH_TO_START/FINISH_TO_FINISH)
- Validate: không circular dependency (đã có logic check circular parent → mở rộng)
- UI: Gantt chart view với dependency arrows
- Business rule: không cho chuyển task sang DONE nếu predecessor chưa DONE

---

### 9.10. CÂU HỎI TỔNG HỢP NHANH (Có thể bị hỏi bất ngờ)

| # | Câu hỏi | Keyword chuẩn bị |
|---|---------|-------------------|
| 31 | "Giải thích SOLID principles áp dụng trong project" | Interface segregation (Service/ServiceImpl), Single responsibility (mỗi service 1 domain) |
| 32 | "Design pattern nào bạn đã sử dụng?" | Outbox, Observer (pub/sub), Repository, Builder (Lombok), Strategy (PermissionPolicy) |
| 33 | "Nếu Redis down, hệ thống còn hoạt động không?" | Token validation fail → không login được. Notification mất. Cần fallback. |
| 34 | "Giải thích CAP theorem, hệ thống của bạn thuộc loại nào?" | CP (Consistency + Partition tolerance) — PostgreSQL strong consistency |
| 35 | "Tại sao dùng WebSocket STOMP thay vì SSE (Server-Sent Events)?" | STOMP: bi-directional, multiplexing; SSE: uni-directional, simpler |
| 36 | "Bao nhiêu bảng trong database? Quan hệ phức tạp nhất là gì?" | ~15 bảng. Task M2M User (assignees) + self-referencing (subtasks) |
| 37 | "Flyway migration có rollback không? Nếu migration fail thì sao?" | Flyway community chỉ forward migration. Rollback phải viết migration mới. |
| 38 | "Tại sao password hash dùng BCrypt? So sánh với Argon2?" | BCrypt: mature, Spring default. Argon2: mới hơn, chống GPU attack tốt hơn. |
| 39 | "Frontend form validation dùng Zod. So sánh Zod với Yup?" | Zod: TypeScript-first, type inference. Yup: older, runtime-only. |
| 40 | "Responsive design? Mobile-friendly?" | shadcn/ui dùng Tailwind responsive. Nhưng không test kỹ mobile. |

---

### 9.11. CHECKLIST CHUẨN BỊ TRƯỚC BẢO VỆ

- [ ] Chuẩn bị demo flow: Register → Create Workspace → Create Project → Tạo Task → Drag Kanban → Real-time Notification
- [ ] Chuẩn bị slide kiến trúc: Client-Server-Redis-PostgreSQL-S3 diagram
- [ ] Chuẩn bị slide Outbox Pattern flow diagram
- [ ] Chuẩn bị slide Permission Matrix (table)
- [ ] Export Postman collection (manual test evidence)
- [ ] Chuẩn bị answer cho "TaskSense khác gì Jira?" (Q1 — câu hỏi chắc chắn bị hỏi)
- [ ] Chuẩn bị answer cho "Tại sao không có test?" (Q19 — câu hỏi chắc chắn bị hỏi)
- [ ] Chuẩn bị answer cho "Đóng góp mới là gì?" (Q3 — câu hỏi sống còn)
- [ ] Fix ít nhất các CRITICAL issues ở Section 1 trước ngày bảo vệ
- [ ] Implement ít nhất 1 "smart" feature để justify tên "TaskSense" (Q2)
