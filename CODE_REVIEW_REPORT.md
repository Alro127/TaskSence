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

### 2.1. `createWorkspace` KHÔNG có @Transactional
**File:** `server/.../service/impl/WorkspaceServiceImpl.java:32-53`
```java
@Override
public WorkspaceResponse createWorkspace(CreateWorkspaceRequest request) {
    // ← THIẾU @Transactional!
    WorkspaceEntity saved = workspaceRepository.save(workspace);  // ← save 1
    WorkspaceMemberEntity member = ...;
    workspaceMemberRepository.save(member);                        // ← save 2
}
```
**Vấn đề:** 2 thao tác save riêng biệt KHÔNG trong cùng transaction:
- Nếu `save(workspace)` thành công nhưng `save(member)` fail → workspace tồn tại nhưng KHÔNG CÓ OWNER → **orphan workspace**, không ai quản lý được.

**Gợi ý:** Thêm `@Transactional` annotation.

---

### 2.2. Soft delete cascade không xử lý
**Vấn đề xuyên suốt nhiều service:**

| Hành động | File | Thiếu gì |
|-----------|------|----------|
| `deleteWorkspace` | `WorkspaceServiceImpl:100-108` | Chỉ soft-delete workspace, KHÔNG xử lý projects, members, invites, join requests |
| `deleteProject` | `ProjectServiceImpl:121-132` | Chỉ soft-delete project, KHÔNG xử lý tasks, members |
| `deleteTask` | `TaskServiceImpl:222-231` | Chỉ soft-delete task, KHÔNG xử lý subtasks |

**Kịch bản lỗi:**
1. OWNER delete workspace → workspace bị soft-delete
2. Members vẫn query được project (vì project chưa bị delete) → truy cập vào workspace "ma"
3. Tasks trong project vẫn hiện trên board

**Gợi ý:** Cascade soft-delete: workspace → projects → tasks. Hoặc filter thêm `workspace.deletedAt IS NULL` khi query project.

---

### 2.3. Remove workspace member không dọn project memberships
**File:** `server/.../service/impl/WorkspaceMemberServiceImpl.java:126`
```java
//projectMemberRepository.deleteByWorkspaceIdAndUserId(workspaceId, memberId);
// ← CODE BỊ COMMENT OUT!
```
**Vấn đề:** Khi xóa member khỏi workspace, member vẫn là thành viên của tất cả project trong workspace đó. Họ vẫn có thể truy cập task, tạo task, v.v.

**Gợi ý:** Uncomment hoặc implement cascade remove: workspace member → project members.

---

### 2.4. `updateMemberRole` cho phép set OWNER nhưng logic chặn
**File:** `server/.../service/impl/WorkspaceMemberServiceImpl.java:86-92`
```java
if (member.getRole() == WorkspaceRole.OWNER) {
    throw new ConflictException("Workspace have only one owner");
}
member.setRole(newRole); // ← Nếu newRole = OWNER → workspace có 2 OWNER!
```
**Vấn đề:** Code chỉ check nếu member **hiện tại** là OWNER thì không cho đổi role. Nhưng KHÔNG check nếu `newRole = OWNER` → admin có thể promote ai đó thành OWNER → 2 OWNER cùng tồn tại.

**Gợi ý:** Thêm check: `if (newRole == WorkspaceRole.OWNER) throw new BadRequestException("Use transfer ownership instead")`.

---

### 2.5. `register` không check email trùng trước khi tạo user
**File:** `server/.../service/impl/AuthServiceImpl.java:74-84`
```java
public void register(AuthRequest request) {
    var user = UserEntity.builder()
        .email(request.getEmail())
        .password(passwordEncoder.encode(request.getPassword()))
        .isActive(false)
        .build();
    userRepository.save(user); // ← Throws DataIntegrityViolationException nếu email trùng
    sendOtp(user.getEmail());
}
```
**Vấn đề:** Dựa vào DB unique constraint để bắt duplicate email → exception không có message thân thiện. Client nhận được `500 Internal Server Error` thay vì `409 Conflict: Email already exists`.

**Gợi ý:** Check `userRepository.existsByEmail(email)` trước khi save, throw `ConflictException`.

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

### 3.1. `SecurityServiceImpl.getCurrentUserId()` query DB mỗi lần gọi
**File:** `server/.../service/impl/SecurityServiceImpl.java:42-44`
```java
public Long getCurrentUserId() {
    return getCurrentUser().getId(); // ← Gọi findByEmail() mỗi lần!
}
```
**Vấn đề:** Mỗi request thường gọi `getCurrentUserId()` 2-5 lần (trong controller, service, permission checker). Mỗi lần = 1 query `SELECT * FROM users WHERE email = ?`.

**Ước tính:** 1 request tạo task → ~5 lần query user table chỉ để lấy userId.

**Gợi ý:**
- Cache userId vào JWT claims: `jwtTokenProvider.generateAccessToken(email, userId)`
- Hoặc cache trong `SecurityContext` / `RequestScope` bean
- Hoặc ít nhất cache trong `ThreadLocal` cho scope 1 request

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

### 5.4. Wildcard redirect khi route không tồn tại
**File:** `client/src/routes/index.tsx:143-146`
```typescript
{
    path: "*",
    element: <Navigate to="/auth/login" replace />,
}
```
**Vấn đề:** Mọi URL không hợp lệ → redirect về login, kể cả khi user đã đăng nhập. Nên hiển thị 404 page.

**Gợi ý:** Thêm 404 page, chỉ redirect về login nếu chưa authenticated.

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

### 6.3. Email template sai nội dung
**File:** `server/.../service/EmailService.java:24-49`

Email workspace invite có:
```html
<h2>Password Reset Request</h2>
<p>We received a request to reset your password.</p>
```
→ Copy-paste từ template reset password, quên đổi nội dung!

Ngoài ra: email nói `"This link will expire in 15 minutes"` nhưng code set `expiredAt = now + 7 days`.

---

### 6.4. Frontend URL sai trong config
**File:** `server/src/main/resources/application.yaml:5`
```yaml
frontend-url: http:/localhost:5173  # ← Thiếu 1 dấu "/"
```
Đúng: `http://localhost:5173`

---

### 6.5. Mix `jakarta.transaction` và `spring.transaction`
Một số service dùng `jakarta.transaction.Transactional` (AuthServiceImpl, ProjectServiceImpl), trong khi đa số dùng `org.springframework.transaction.annotation.Transactional`.

**Vấn đề:** `jakarta.transaction.Transactional` không hỗ trợ rollback rules, propagation, isolation customization. Nên thống nhất dùng Spring's `@Transactional`.

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
| **Tính toàn vẹn dữ liệu** | 5 | Thiếu @Transactional, cascade delete, race conditions |
| **Hiệu năng** | 5 | N+1 queries, thiếu pagination, getCurrentUser() overhead |
| **Resilience/Production** | 3 | Không retry, không circuit breaker, fire-and-forget messaging |
| **Testing** | 1 | Chỉ có contextLoads() |
| **Code Quality** | 6 | Khá sạch, nhưng có typo, System.out, copy-paste bug |
| **Client Architecture** | 6 | RTK Query tốt, nhưng thiếu token refresh, DRY violation |

### Roadmap ưu tiên sửa

#### Giai đoạn 1: Sửa CRITICAL trước bảo vệ (1-2 ngày)
- [ ] Xóa hardcoded JWT secret → dùng env variable
- [ ] Xóa `System.out.println(rawToken)`
- [ ] Thêm `@Transactional` cho `createWorkspace`
- [ ] Fix `markAsRead` IDOR vulnerability
- [ ] Fix email template copy-paste bug
- [ ] Fix `updateMemberRole` cho phép set OWNER
- [ ] Dùng `SecureRandom` cho OTP
- [ ] Thêm check email trùng trước khi register
- [ ] Fix frontend-url typo trong application.yaml

#### Giai đoạn 2: Cải thiện trải nghiệm (3-5 ngày)
- [ ] Implement token refresh interceptor trên client
- [ ] Thêm rate limiting cho auth endpoints
- [ ] Implement cascade soft-delete (workspace → projects → tasks)
- [ ] Uncomment project member cleanup khi remove workspace member
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
