# BÁO CÁO PHẢN BIỆN CODE - TaskSense
## (Góc nhìn Giảng viên Phản biện Khóa luận Tốt nghiệp)

> **Ngày review lần 1:** 2026-03-10
> **Ngày review lần 2 (cập nhật):** 2026-03-13
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
9. [Câu hỏi phản biện dự kiến & Gợi ý trả lời](#9-câu-hỏi-phản-biện-dự-kiến--gợi-ý-trả-lời)

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

### ~~1.2. Token reset password bị leak ra log~~ ✅ ĐÃ FIX
> Đã xóa `System.out.println(rawToken)` trong `AuthServiceImpl.java`.

---

### ~~1.3. OTP sinh bằng `Random` thay vì `SecureRandom`~~ ✅ ĐÃ FIX
> Đã đổi sang `new SecureRandom()` tại `AuthServiceImpl.java:139`.
>
> **Lưu ý nhỏ:** Nên tạo `SecureRandom` instance tĩnh (static field) thay vì tạo mới mỗi lần gọi để tối ưu performance. Nhưng đây không phải lỗi bảo mật.

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
private String email;
@NonNull
private String password; // ← Chỉ check non-null, không check độ dài/phức tạp
```
**Vấn đề:** User có thể đặt password là `"1"` hoặc `""` (empty string). Không có kiểm tra:
- Độ dài tối thiểu (ít nhất 8 ký tự)
- Độ phức tạp (chữ hoa, chữ thường, số, ký tự đặc biệt)
- Không có `@Email` annotation trên trường email

**Thêm vào đó:** `AuthController` không dùng `@Valid` trên `@RequestBody AuthRequest` → validation annotation (nếu thêm) cũng sẽ **không được kích hoạt**.

**Gợi ý:**
- Thêm `@Size(min = 8)` + `@Pattern` hoặc dùng Passay library
- Thêm `@Email` cho trường email
- Thêm `@Valid` trước `@RequestBody` trong controller

---

### 1.6. Google OAuth tạo user không cần xác thực, password rỗng
**File:** `server/.../service/impl/AuthServiceImpl.java:239-244`
```java
var accountEntity = UserEntity.builder()
    .email(email)
    .password("") // ← Empty password!
    .fullName(fullName)
    .avatarUrl(picture)
    .build();
```
**Vấn đề:**
- User Google được tạo với `password = ""` và `isActive` không được set tường minh.
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

### ~~1.8. `markAsRead` không verify notification thuộc về user~~ ✅ ĐÃ FIX
> Đã thêm check IDOR: `if (!notification.getReceiver().getId().equals(userId)) throw new ForbiddenException(...)` tại `NotificationServiceImpl.java:104-106`.

---

### 1.9. ⚡ MỚI — CORS Configuration quá rộng
**File:** `server/.../config/security/CorsConfig.java`
```java
allowedMethods("*")   // ← Cho phép mọi HTTP method
allowedHeaders("*")   // ← Cho phép mọi header
exposedHeaders("*")   // ← Expose mọi header
```
**Vấn đề:** Mặc dù origin đã được config từ properties, nhưng wildcard cho methods/headers làm tăng attack surface. Production nên restrict:
- `allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")`
- `allowedHeaders("Authorization", "Content-Type")`

---

### 1.10. ⚡ MỚI — Database credentials hardcode
**File:** `server/src/main/resources/application.yaml:9-10`
```yaml
username: postgres
password: postgres
```
**Vấn đề:** Default database credentials nằm trong config file. Nên dùng environment variable.

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
> Đã implement `projectMemberRepository.softDeleteByWorkspaceIdAndUserId(workspaceId, userId, now)`.

---

### ~~2.4. `updateMemberRole` cho phép set OWNER nhưng logic chặn~~ ✅ ĐÃ FIX

---

### ~~2.5. `register` không check email trùng trước khi tạo user~~ ✅ ĐÃ FIX

---

### 2.6. Refresh token không rotate (Token Reuse Attack)
**File:** `server/.../service/impl/AuthServiceImpl.java:126-129`
```java
return AuthResponse.builder()
    .accessToken(newAccessToken)
    .refreshToken(request.getToken()) // ← TRẢ LẠI REFRESH TOKEN CŨ!
    .build();
```
**Vấn đề:** Refresh token không được rotate (tạo mới) sau mỗi lần sử dụng. Nếu refresh token bị steal, attacker và user thật đều dùng được vô thời hạn.

**Gợi ý:** Mỗi lần refresh, tạo refresh token mới + xóa token cũ trong Redis + trả về token mới.

---

### 2.7. Thiếu validation nghiệp vụ ngày tháng
**File:** `server/.../dto/request/CreateTaskRequest.java` — ✅ ĐÃ CÓ `@FutureOrPresent` cho startDate và dueDate.

**File:** `server/.../dto/request/CreateProjectRequest.java` — ❌ VẪN THIẾU
```java
private LocalDate startDate;    // ← Không có validation
private LocalDate endDate;      // ← Không có validation
```
**Vấn đề:** Project vẫn thiếu validation:
- `startDate` phải trước `endDate`
- `endDate` không được trong quá khứ (tùy nghiệp vụ)

**Gợi ý:** Thêm custom validator hoặc check trong service layer.

---

### 2.8. ⚡ MỚI — **BUG CRITICAL: `resetPassword` dùng sai Redis key**
**File:** `server/.../service/impl/AuthServiceImpl.java:199`
```java
// forgotPassword() LƯU vào:
RedisKeys.resetToken(hashedToken)   // → "reset:token:xxx"

// resetPassword() ĐỌC từ:
RedisKeys.refreshToken(hashedToken) // → "refresh:token:xxx"  ← SAI!
```
**Vấn đề:** `forgotPassword()` lưu token vào key `reset:token:xxx` (line 187), nhưng `resetPassword()` lại đọc từ key `refresh:token:xxx` (line 199). **Kết quả: chức năng reset password HOÀN TOÀN KHÔNG HOẠT ĐỘNG.**

Đây là bug **sống còn** — nếu giảng viên test thử flow forgot password trong lúc bảo vệ, nó sẽ fail.

**Fix:**
```java
// Line 199: đổi từ
String redisKey = RedisKeys.refreshToken(hashedToken);
// thành
String redisKey = RedisKeys.resetToken(hashedToken);
```

---

## 3. HIGH - Hiệu năng & N+1 Query

### ~~3.1. `SecurityServiceImpl.getCurrentUserId()` query DB mỗi lần gọi~~ ✅ ĐÃ FIX
> Đã dùng `@RequestScope` + cache instance variable.

---

### 3.2. `resolveAssignees` N+1 query pattern
**File:** `server/.../service/impl/TaskServiceImpl.java:78-92`
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
**File:** `server/.../security/permission/PermissionChecker.java:145-150`
```java
private boolean isWorkspaceOwnerOfProject(Long projectId, Long userId) {
    return projectRepository.findById(projectId)              // query 1
        .flatMap(project -> workspaceMemberRepository
            .findByWorkspaceIdAndUserId(..., userId))          // query 2
        ...
}
```
**Vấn đề:** Method này được gọi trong mọi project-level permission check. Một request có thể chạy 10+ queries chỉ cho permission checking.

**Gợi ý:** Viết 1 query JOIN: `SELECT wm.role FROM workspace_members wm JOIN projects p ON ... WHERE p.id = ? AND wm.user_id = ?`

---

### ~~3.4. Thiếu pagination cho các list endpoint~~ ✅ ĐÃ FIX
> Pagination đã được implement đầy đủ với `Pageable` + `PageResponse<T>`:
> - TaskController, WorkspaceMemberController, ProjectMemberController
> - WorkspaceJoinRequestController, ProjectJoinRequestController
> - WorkspaceServiceImpl (getMyWorkspaces, getPublicWorkspaces)
> - ProjectServiceImpl (getProjectsByWorkspace)
> - Và các service khác

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
**Vấn đề:** Nếu SMTP server tạm thời unavailable, email mất vĩnh viễn (OTP, invite, reset password).

**Gợi ý:**
- Sử dụng `@Retryable` (Spring Retry) với exponential backoff
- Log error đúng cách (dùng logger, không `System.err`)

---

### 4.2. Redis Pub/Sub không đảm bảo delivery
**Vấn đề:** Redis Pub/Sub là **fire-and-forget**. Nếu subscriber offline → message mất.

**Gợi ý:** Dùng **Redis Streams** hoặc RabbitMQ.

---

### 4.3. Không có Circuit Breaker cho external services
**Vấn đề:** Google OAuth API, SMTP, AWS S3 — nếu chậm/down → thread bị block.

**Gợi ý:** Dùng Resilience4j `@CircuitBreaker` + `@TimeLimiter`.

---

### 4.4. Không có timeout configuration hợp lý cho Redis
**File:** `server/src/main/resources/application.yaml:33`
```yaml
redis:
  timeout: 60000  # ← 60 giây quá dài
```
**Gợi ý:** Giảm xuống 3-5 giây. Thêm connection pool config.

---

## 5. MEDIUM - Client-side Issues

### 5.1. KHÔNG có Token Refresh Interceptor
**Vấn đề:** 18 file API riêng biệt, không file nào có xử lý khi access token hết hạn (401).
- User bị redirect về login page → mất toàn bộ work đang làm

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

### 5.2. Mỗi feature tạo riêng `createApi` — vi phạm DRY **NGHIÊM TRỌNG**
**Cập nhật:** Từ 8 files ban đầu, giờ đã tăng lên **18 file API riêng biệt**:
- authApi, workspaceApi, projectApi, taskApi, userApi
- workspaceMemberApi, projectMemberApi, workspaceInviteApi
- workspaceJoinRequestApi, projectJoinRequestApi
- notificationApi, commentApi, attachmentApi
- userSkillApi, teamTemplateApi, teamMemberTemplateApi
- sprintApi, tagApi

**Vấn đề nặng hơn trước:**
- `baseUrl` config bị duplicate **18 lần**
- Auth header logic duplicate **17 lần** (trừ authApi)
- Không thể thêm global interceptor (token refresh) ở 1 chỗ → phải sửa **tất cả 18 files**
- Nếu cần đổi base URL hoặc thêm header → sửa tất cả files

**Gợi ý:** Tạo shared `baseQueryWithAuth` trong file chung, import ở tất cả api files. Hoặc gom thành 1 `createApi` duy nhất dùng `injectEndpoints`.

---

### 5.3. Route guard chỉ check localStorage
**File:** `client/src/features/auth/authSlice.ts:11-14`
```typescript
isAuthenticated: !!localStorage.getItem("accessToken"),
```
**Vấn đề:** Chỉ check token có tồn tại không. Token có thể đã expire, bị tamper, hoặc thuộc session cũ.

**Gợi ý:** Validate token expiry client-side (decode JWT, check `exp` claim).

---

### ~~5.4. Wildcard redirect khi route không tồn tại~~ ✅ ĐÃ FIX

---

### 5.5. ⚡ MỚI — 4 trang placeholder chưa implement
**File:** `client/src/routes/index.tsx:25-34, 128-142`
```typescript
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted p-6">
      <h2>This section is mocked for quick access and will be implemented in a future sprint.</h2>
    </div>
  );
}
```
**Các trang placeholder:**
- `/tasks` — My Tasks
- `/calendar` — Calendar
- `/analytics` — Analytics
- `/settings` — Settings

**Vấn đề:** 4 trang hiển thị trong sidebar/navigation nhưng chỉ là placeholder. Giảng viên phản biện sẽ hỏi tại sao để chúng trong code nếu chưa implement.

**Gợi ý ưu tiên:**
- **My Tasks** — đơn giản nhất: query all tasks where assignee = current user, đã có API
- **Analytics** — nếu muốn justify tên "TaskSense", đây là trang quan trọng nhất

---

### 5.6. ⚡ MỚI — Hardcoded pagination sizes rải rác
**14 instances** hardcoded pagination size trong client code:
- `size = 9` (teamTemplateApi)
- `size = 10` (5 files)
- `size = 20` (4 files)
- `size = 50` (taskApi)
- `limit = 10`, `limit = 20` (notificationApi, commentApi)

**Vấn đề:** Không có centralized constants file → thay đổi default page size phải sửa nhiều nơi.

**Gợi ý:** Tạo `src/lib/constants.ts` cho pagination defaults, status options, role definitions.

---

### 5.7. ⚡ MỚI — Google Client ID placeholder check
**File:** `client/src/features/auth/pages/LoginPage.tsx:124`
```typescript
"your-google-client-id-here" // placeholder check
```
**Vấn đề:** Nếu quên config VITE_GOOGLE_CLIENT_ID, Google login sẽ fail mà không có error message rõ ràng.

---

## 6. MEDIUM - Code Quality & Maintenance

### 6.1. `System.out.println` thay vì Logger — **TĂNG TỪ 7 LÊN 15 CHỖ**
| File | Dòng | Nội dung |
|------|------|----------|
| `ReminderWorker.java` | 34 | `"Sync Reminder worker is running"` |
| `ReminderWorker.java` | 54 | `"Reminder worker is running"` |
| `OutboxWorker.java` | 24 | `"Worker is running"` |
| `OutboxWorker.java` | 34 | `"events is empty"` |
| `OutboxWorker.java` | 45 | `"Worker is running"` |
| `OutboxWorker.java` | 55 | `"events is empty"` |
| `OutboxEventProcessor.java` | 32 | `"process event"` |
| `EmailService.java` | 33 | `"Realtime publish failed, worker will retry"` |
| `NotificationServiceImpl.java` | 89 | In unread count |
| `NotificationServiceImpl.java` | 165 | In "Receiver is null" |
| `NotificationServiceImpl.java` | 196 | `"Realtime publish failed, worker will retry"` |
| `EmailSubscriber.java` | 25 | `"EmailSubscriber received message"` |
| `EmailSubscriber.java` | 47 | `System.err.println(...)` — error bị nuốt |
| `SocketSubscriber.java` | 24 | `"SocketSubscriber received message"` |

**Gợi ý:** Thay tất cả bằng SLF4J Logger (`@Slf4j` annotation từ Lombok).

---

### 6.2. Typo trong code
| Vị trí | Sai | Đúng |
|--------|-----|------|
| Package name | `service.subcriber` | `service.subscriber` |

> **Lưu ý:** `saveAndPublic()` đã được rename thành `saveAndPublish()` ✅

---

### ~~6.3. Email template sai nội dung~~ ✅ ĐÃ FIX

---

### ~~6.4. Frontend URL sai trong config~~ ✅ ĐÃ FIX

---

### ~~6.5. Mix `jakarta.transaction` và `spring.transaction`~~ ✅ ĐÃ FIX

---

### 6.6. ⚡ MỚI — `@Valid` thiếu trong AuthController
**File:** `server/.../controller/AuthController.java`
```java
// Line 21 - thiếu @Valid
public ResponseEntity<ApiResponse<Void>> register(@RequestBody AuthRequest request)

// Line 43 - thiếu @Valid
public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody AuthRequest request)

// Line 91 - thiếu @Valid
public ResponseEntity<ApiResponse<Void>> resetPassword(@RequestBody ResetPasswordRequest request)
```
**Vấn đề:** Nếu thêm validation annotation vào DTO mà không thêm `@Valid` trong controller, validation sẽ KHÔNG được kích hoạt. Đây là lỗi phổ biến trong Spring Boot mà giảng viên có kinh nghiệm sẽ nhận ra ngay.

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

**Lưu ý:** `pom.xml` đã có test dependencies (spring-boot-starter-data-redis-test, spring-boot-starter-mail-test, spring-boot-starter-security-test, spring-boot-starter-webmvc-test) → framework test đã sẵn sàng, chỉ thiếu test code thực tế.

---

### 7.2. Swagger UI enabled mà không phân biệt environment
**File:** `application.yaml:80-90`
```yaml
springdoc:
  swagger-ui:
    enabled: true
    try-it-out-enabled: true
```
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

### Ma trận đánh giá (Cập nhật lần 2)

| Tiêu chí | Điểm lần 1 | Điểm lần 2 | Thay đổi | Ghi chú |
|-----------|:-----------:|:-----------:|:--------:|---------|
| **Kiến trúc tổng thể** | 7 | 7.5 | ↑ | Thêm Comment, Sprint, Tag features. Pagination đầy đủ |
| **Bảo mật** | 4 | 5 | ↑ | Fix IDOR, SecureRandom, xóa token leak. Còn: hardcoded secret, no rate limit, CORS rộng |
| **Tính toàn vẹn dữ liệu** | 7.5 | 6.5 | ↓ | **Bug critical resetPassword dùng sai Redis key**. Còn: no token rotation, thiếu date validation |
| **Hiệu năng** | 6 | 7 | ↑ | Pagination đã implement đầy đủ. Còn: N+1 queries, PermissionChecker 2 queries |
| **Resilience/Production** | 3 | 3 | → | Không thay đổi. Không retry, không circuit breaker |
| **Testing** | 1 | 1 | → | Vẫn chỉ contextLoads(). Có test dependencies nhưng 0 test code |
| **Code Quality** | 7 | 6 | ↓ | System.out.println TĂNG từ 7 → 15 chỗ. Thiếu @Valid. Package typo còn |
| **Client Architecture** | 6.5 | 5.5 | ↓ | API duplication TĂNG từ 8 → 18 files. Vẫn thiếu token refresh. 4 placeholder pages |

### Những điểm CẢI THIỆN so với lần review trước
1. ✅ Pagination đầy đủ (server + client)
2. ✅ Fix IDOR vulnerability trong markAsRead
3. ✅ SecureRandom cho OTP
4. ✅ Xóa token leak ra log
5. ✅ Comment feature mới (CRUD, mentions, reactions, nested comments)
6. ✅ Sprint management feature mới
7. ✅ Tag/Label feature mới
8. ✅ Attachment feature mới (S3 presigned URL)
9. ✅ Team template feature mới
10. ✅ `saveAndPublish()` renamed correctly
11. ✅ Soft delete cascade đầy đủ

### Những điểm MỚI CẦN CHÚ Ý
1. 🔴 **BUG: resetPassword dùng sai Redis key** → chức năng không hoạt động
2. 🔴 API duplication tệ hơn (8 → 18 files)
3. 🔴 System.out.println nhiều hơn (7 → 15 chỗ)
4. 🟡 4 placeholder pages hiển thị cho user
5. 🟡 Thiếu @Valid trên AuthController
6. 🟡 CORS configuration quá rộng
7. 🟡 Database credentials hardcode

### Roadmap ưu tiên sửa

#### Giai đoạn 1: Fix NGAY trước bảo vệ (vài giờ)
- [ ] **FIX BUG: `resetPassword` dùng `RedisKeys.resetToken()` thay vì `refreshToken()`**
- [ ] Xóa hardcoded JWT secret → dùng env variable
- [ ] Xóa tất cả `System.out.println` → dùng `@Slf4j`
- [ ] Thêm `@Valid` vào AuthController
- [ ] Fix package typo `subcriber` → `subscriber`

#### Giai đoạn 2: Cải thiện trải nghiệm (1-2 ngày)
- [ ] Tạo shared `baseQueryWithAuth` cho client API (giảm 18 files → 1 shared utility)
- [ ] Implement token refresh interceptor (baseQueryWithReauth)
- [ ] Implement "My Tasks" page (đơn giản nhất trong 4 placeholder)
- [ ] Validate password strength (`@Size(min = 8)` + `@Pattern`)
- [ ] Thêm date validation cho CreateProjectRequest
- [ ] Refresh token rotation
- [ ] Thêm rate limiting cho auth endpoints

#### Giai đoạn 3: Production-ready (3-5 ngày)
- [ ] Viết unit tests cho services chính (ít nhất PermissionPolicy, AuthService)
- [ ] Thêm Spring Retry cho email sending
- [ ] Profile separation (dev/staging/prod)
- [ ] Restrict CORS configuration
- [ ] Tắt Swagger cho production
- [ ] Optimize N+1 queries
- [ ] Tạo constants file cho client

---

> **Ghi chú:** Mặc dù có nhiều vấn đề cần sửa, project đã có những cải thiện đáng kể: Comment system, Sprint/Tag/Attachment features, Pagination, IDOR fix. Kiến trúc tổng thể vẫn tốt (clean architecture, permission matrix, Redis caching, WebSocket, Outbox pattern). Tuy nhiên, **bug resetPassword là critical** và cần fix ngay lập tức trước khi bảo vệ.

---

## 9. CÂU HỎI PHẢN BIỆN DỰ KIẾN & GỢI Ý TRẢ LỜI

> Phần này mô phỏng các câu hỏi mà giảng viên phản biện **rất có khả năng** sẽ đặt ra trong buổi bảo vệ khóa luận. Mỗi câu hỏi kèm phân tích điểm yếu hiện tại và gợi ý cách trả lời/cải thiện.

---

### 9.1. NHÓM CÂU HỎI: TÍNH MỚI & ĐÓNG GÓP KHOA HỌC

#### Q1: "TaskSense khác gì so với Jira, Trello, Asana, ClickUp? Tại sao người dùng nên chọn TaskSense thay vì các công cụ đã có trên thị trường?"

**Phân tích thực tế (cập nhật):**
So với review lần 1, TaskSense đã bổ sung thêm nhiều tính năng:
- ✅ **Comment system** với mentions + reactions (Trello, Jira đều có)
- ✅ **Sprint management** (gần giống Jira Sprint)
- ✅ **Tags/Labels** cho tasks
- ✅ **File attachments** (S3 presigned URL)
- ✅ **Team templates** (unique feature)

**Những gì TaskSense VẪN THIẾU so với Jira/Trello:**
| Tính năng | Jira | Trello | TaskSense |
|-----------|------|--------|-----------|
| Burndown chart | ✅ | ❌ | ❌ |
| Time tracking | ✅ | ✅ (Power-Up) | ❌ |
| Gantt chart | ✅ | ❌ | ❌ |
| Custom fields | ✅ | ✅ | ❌ |
| Automation rules | ✅ | ✅ (Butler) | ❌ |
| Integration (Slack, GitHub) | ✅ | ✅ | ❌ |
| Reporting/Analytics | ✅ | ❌ | ❌ (placeholder) |
| Calendar view | ✅ | ✅ | ❌ (placeholder) |
| Workflow customization | ✅ | ❌ | ❌ (cố định 4 status) |
| Activity log/History | ✅ | ✅ | ❌ |
| Public workspace explore | ❌ | ❌ | ✅ |
| Team templates | ❌ | ❌ | ✅ |
| User skill profiles | ❌ | ❌ | ✅ |
| Sprint management | ✅ | ❌ | ✅ (mới) |
| Comment reactions | ❌ | ❌ | ✅ (mới) |

**Gợi ý trả lời:**
- Nhấn mạnh **public workspace discovery** (Jira/Trello không có)
- Nhấn mạnh **user skill profiles** + **team templates** — unique combination
- Sprint + Comment + Tags cho thấy feature set đã gần đủ cho team collaboration
- Thừa nhận: TaskSense là **MVP**, tập trung kiến trúc backend vững chắc

---

#### Q2: "Tên dự án là 'TaskSense' — 'Sense' ở đây nghĩa là gì? Có tính năng AI/ML nào liên quan đến 'sensing' hay 'intelligent' không?"

**Phân tích thực tế:**
- **THỰC TẾ: Không có bất kỳ tính năng AI/ML nào** trong toàn bộ codebase
- Route `/analytics` chỉ là placeholder
- ElasticSearch dependency có nhưng không rõ đã integrate chưa

**Đây là câu hỏi RẤT KHÓ trả lời** nếu không có kế hoạch AI rõ ràng.

**Gợi ý trả lời:**
- Giải thích "Sense" theo nghĩa "nhận biết ngữ cảnh" (context-aware)
- Nếu có thời gian, implement ít nhất 1 tính năng "smart":
  - **Smart task assignment**: dựa vào `UserSkill` → suggest assignee phù hợp
  - **Task priority suggestion**: phân tích deadline, workload
  - **Overdue prediction**: dự đoán task nào sẽ trễ deadline

---

#### Q3: "Đóng góp mới (contribution) của khóa luận này là gì?"

**Gợi ý trả lời — nhấn mạnh các điểm kiến trúc:**
1. **Outbox Pattern** — consistency giữa DB transaction và message publishing
2. **Hierarchical RBAC** — workspace role + project role với permission matrix tập trung
3. **Event-Driven Architecture** — Redis Pub/Sub cho notification pipeline
4. **WebSocket Authentication** — JWT auth trên STOMP protocol
5. **Presigned URL pattern** — client upload trực tiếp lên S3
6. *(Mới)* **Comment Mention System** — real-time notification khi được mention trong comment
7. *(Mới)* **Sprint Management** — tổ chức task theo sprint cycle

---

### 9.2. NHÓM CÂU HỎI: KIẾN TRÚC & THIẾT KẾ

#### Q4: "Tại sao chọn Redis Pub/Sub mà không dùng RabbitMQ hoặc Kafka?"

**Gợi ý trả lời:**
- Trade-off: Redis Pub/Sub đơn giản, phù hợp MVP
- Outbox Pattern bù đắp (notification events có retry qua worker)
- Redis đã dùng cho token storage → tận dụng infrastructure
- Production nên dùng Redis Streams hoặc RabbitMQ

---

#### Q5: "Outbox Pattern xử lý idempotency thế nào? Notification có bị gửi 2 lần không?"

**Phân tích thực tế:**
```java
// OutboxEventProcessor.java
notificationPublisher.publish(notificationMessage);  // ← step 1
event.setDeliveryStatus(DeliveryStatus.SUCCESS);      // ← step 2
outboxEventRepository.save(event);                     // ← step 3
```
- Nếu crash giữa step 1 và step 3 → **duplicate notification**
- Không có deduplication mechanism

**Gợi ý trả lời:**
- Thừa nhận: hiện tại là **at-least-once delivery**, chưa phải exactly-once
- Duplicate notification không gây hại nghiêm trọng
- Cải thiện: consumer track processed event IDs (idempotency key)

---

#### Q6: "ElasticSearch dependency dùng để làm gì? Tại sao không dùng PostgreSQL full-text search?"

**Gợi ý trả lời:**
- Nếu chưa dùng: thừa nhận đây là planned feature
- PostgreSQL FTS đủ cho 10K-100K records
- ElasticSearch cần thiết khi >1M records hoặc cần fuzzy search

---

#### Q7: "Tại sao dùng Spring Boot 4.0.3?"

**Gợi ý:** Kiểm tra lại version trong pom.xml, chuẩn bị giải thích lý do chọn version. Spring Boot 4.0.x là phiên bản mới, ít tài liệu community.

---

#### Q8: "Giải thích authentication flow. Tại sao CSRF bị tắt?"

**Gợi ý trả lời:**
1. Client gửi POST `/auth/login/local` với email/password
2. Server validate → generate access token + refresh token (JWT, HS256)
3. Client lưu token vào localStorage (nên nói đã biết rủi ro XSS)
4. Mỗi request: `Authorization: Bearer {token}`
5. `JwtAuthenticationFilter` validate token, set `SecurityContext`
6. CSRF tắt vì: stateless REST API, không dùng cookie → CSRF không áp dụng

---

#### Q9: "Hệ thống phân quyền 2 cấp hoạt động thế nào? Workspace OWNER vào project mà không phải member thì sao?"

**Gợi ý trả lời:**
- Hierarchy: Workspace OWNER > Project MANAGER > MEMBER > VIEWER
- OWNER bypass project-level permission check thông qua `PermissionChecker.isWorkspaceOwnerOfProject()`
- OWNER quản lý mọi project mà không cần join từng project

---

### 9.3. NHÓM CÂU HỎI: HIỆU NĂNG & KHẢ NĂNG MỞ RỘNG

#### Q10: "Hệ thống handle bao nhiêu concurrent users? Đã test performance chưa?"

**Phân tích:**
- Không có performance test (JMeter, Gatling, k6)
- Bottleneck: N+1 query, WebSocket in-memory, OutboxWorker synchronous
- Ước tính: ~100-500 concurrent users với architecture hiện tại

---

#### Q11: "OutboxWorker chạy mỗi 10 giây. Đây có phải real-time không?"

**Gợi ý trả lời:**
- Nên gọi là **"near real-time"** (delay 0-10 giây)
- Cải thiện: hybrid approach — publish trực tiếp qua WebSocket + outbox cho retry

---

#### Q12: "Task search dùng native SQL. Tại sao không dùng Specification/Criteria API?"

**Gợi ý trả lời:**
- Native query cho performance tốt. Đã dùng parameterized query → an toàn SQL injection
- Nhược điểm: nếu đổi DB thì phải viết lại
- Nên dùng Criteria API hoặc QueryDSL cho maintainability

---

### 9.4. NHÓM CÂU HỎI: CHỨC NĂNG

#### Q13: "Route My Tasks, Calendar, Analytics, Settings đều là placeholder. Tại sao?"

**Gợi ý:** Thừa nhận là roadmap features, chưa kịp implement. Ưu tiên My Tasks vì đơn giản nhất.

---

#### ~~Q14: "Task không có comment/discussion."~~ ✅ ĐÃ IMPLEMENT
> Comment system đã được implement đầy đủ: CRUD, mentions, reactions, nested comments.

---

#### Q15: "Task không có activity log/history."
**Gợi ý:** Outbox Event table có thể mở rộng thành audit log.

---

#### Q16: "Task status cố định 4 giá trị. Không customize workflow."
**Gợi ý:** Thiết kế đơn giản có chủ đích. Production: tạo `StatusEntity` riêng.

---

### 9.5. NHÓM CÂU HỎI: BẢO MẬT NÂNG CAO

#### Q17: "CORS configuration có vấn đề gì?"
**Trả lời:** Thừa nhận wildcard quá rộng. Production cần restrict methods + headers.

---

#### Q18: "Refresh token lưu ở đâu? Logout có invalidate không? Token bị steal thì sao?"
**Trả lời:**
- Refresh token lưu localStorage (biết rủi ro XSS)
- Logout: có blacklist token trong Redis ✅
- Thiếu token rotation → stolen token dùng mãi (đề xuất cải thiện)

---

### 9.6. NHÓM CÂU HỎI: TESTING & DEVOPS

#### Q19: "Chỉ có 1 test contextLoads(). Đảm bảo code đúng thế nào?"
**Trả lời:**
- Đã test thủ công qua Swagger UI/Postman
- Thừa nhận thiếu automated test là hạn chế lớn
- Test dependencies đã có sẵn trong pom.xml

---

#### Q20: "Deploy thế nào? CI/CD? Dockerfile?"
**Trả lời:**
- Docker Compose cho PostgreSQL, Redis, ElasticSearch
- Application chạy bằng `./mvnw spring-boot:run`
- Production deployment: chưa setup (ngoài scope khóa luận)

---

### 9.7. NHÓM CÂU HỎI: NGHIỆP VỤ & UX

#### Q21: "User research? Khảo sát nhu cầu?"
**Trả lời:** Tham khảo Jira, Trello + kinh nghiệm cá nhân.

---

#### Q22: "Public workspace — kịch bản sử dụng thực tế?"
**Trả lời:** Open-source project management, student group collaboration, community task forces. So sánh với GitHub organization.

---

#### Q23: "UserSkill entity có nhưng không dùng ở đâu ngoài profile?"
**Trả lời:** Planned feature — skill-based task assignment. Hiện tại cho team lead xem skill để assign thủ công.

---

#### Q24: "Soft delete nhưng không có restore/undo. Mục đích?"
**Trả lời:** Data integrity, audit trail, compliance. Future: admin panel với restore.

---

### 9.8. NHÓM CÂU HỎI: SO SÁNH CÔNG NGHỆ

#### Q25: "Tại sao React + Redux Toolkit?"
**Trả lời:** Ecosystem lớn nhất, RTK Query built-in caching, SPA không cần SSR.

---

#### Q26: "Tại sao Spring Boot + Java?"
**Trả lời:** Enterprise-standard, Java 21 modern features, Spring Security built-in JWT/OAuth.

---

#### Q27: "Database dùng auto-increment Long ID. Tại sao không UUID?"
**Trả lời:** Performance indexing tốt hơn. Đã có permission check → enumerate nhưng không access được. UUID v7 là best practice.

---

### 9.9. NHÓM CÂU HỎI: BẢO TRÌ & MỞ RỘNG

#### Q28: "18 file createApi riêng. Thêm global interceptor phải sửa bao nhiêu file?"
**Trả lời:** Thừa nhận technical debt nghiêm trọng. Plan: shared baseQueryWithAuth + injectEndpoints.

---

#### Q29: "Database migration dùng Flyway?"
**Trả lời:** Version-controlled migrations. Seed data tách riêng cho development.

---

#### Q30: "Thêm Task Dependencies thì thiết kế thế nào?"
**Trả lời:**
- `TaskDependencyEntity` (predecessor_id, successor_id, type)
- Validate circular dependency
- Business rule: không cho DONE nếu predecessor chưa DONE

---

### 9.10. CÂU HỎI TỔNG HỢP NHANH

| # | Câu hỏi | Keyword chuẩn bị |
|---|---------|-------------------|
| 31 | "SOLID principles áp dụng?" | Interface segregation (Service/Impl), Single responsibility |
| 32 | "Design pattern nào đã dùng?" | Outbox, Observer (pub/sub), Repository, Builder (Lombok), Strategy (PermissionPolicy) |
| 33 | "Redis down thì sao?" | Token validation fail, notification mất. Cần fallback |
| 34 | "CAP theorem, hệ thống thuộc loại nào?" | CP — PostgreSQL strong consistency |
| 35 | "WebSocket STOMP thay vì SSE?" | STOMP: bi-directional, multiplexing |
| 36 | "Bao nhiêu bảng? Quan hệ phức tạp nhất?" | ~15+ bảng. Task M2M User + self-ref (subtasks) + Comment (nested) |
| 37 | "Flyway migration rollback?" | Community chỉ forward. Rollback phải viết migration mới |
| 38 | "BCrypt vs Argon2?" | BCrypt: mature, Spring default. Argon2: mới hơn, chống GPU tốt hơn |
| 39 | "Zod vs Yup?" | Zod: TypeScript-first, type inference. Yup: older, runtime-only |
| 40 | "Responsive design?" | shadcn/ui + Tailwind responsive. Chưa test kỹ mobile |

---

### 9.11. ⚡ MỚI — CÂU HỎI VỀ TÍNH NĂNG MỚI

#### Q41: "Comment system có support rich text/markdown không?"
**Trả lời:** Hiện tại plain text. Có thể dùng markdown renderer ở client, server lưu raw markdown.

---

#### Q42: "Sprint management hoạt động thế nào? Có burndown chart không?"
**Trả lời:** Sprint có start/end date, gán tasks vào sprint. Chưa có burndown chart (cần analytics page).

---

#### Q43: "Team template — kịch bản sử dụng cụ thể?"
**Trả lời:** Tạo cấu trúc team một lần (roles, members), áp dụng cho nhiều project mới. Tiết kiệm thời gian setup lặp lại.

---

#### Q44: "Attachment upload trực tiếp lên S3 hay qua server?"
**Trả lời:** Presigned URL pattern — client request presigned URL từ server, upload trực tiếp lên S3. Giảm tải server, hỗ trợ file lớn.

---

### 9.12. CHECKLIST CHUẨN BỊ TRƯỚC BẢO VỆ

- [ ] **FIX NGAY: Bug resetPassword** (đổi `RedisKeys.refreshToken` → `resetToken`)
- [ ] **FIX NGAY: Xóa System.out.println** (15 chỗ)
- [ ] **FIX NGAY: Thêm @Valid** vào AuthController
- [ ] Chuẩn bị demo flow: Register → OTP → Login → Create Workspace → Create Project → Sprint → Task → Comment → Drag Kanban → Real-time Notification
- [ ] **Test thử flow forgot password** sau khi fix bug
- [ ] Chuẩn bị slide kiến trúc: Client-Server-Redis-PostgreSQL-S3 diagram
- [ ] Chuẩn bị slide Outbox Pattern flow diagram
- [ ] Chuẩn bị slide Permission Matrix (table)
- [ ] Export Postman collection (manual test evidence)
- [ ] Chuẩn bị answer cho "TaskSense khác gì Jira?" (Q1)
- [ ] Chuẩn bị answer cho "Tại sao không có test?" (Q19)
- [ ] Chuẩn bị answer cho "Đóng góp mới là gì?" (Q3)
- [ ] Chuẩn bị answer cho "Sense có nghĩa gì?" (Q2)
- [ ] Fix ít nhất các CRITICAL issues ở Section 1 + 2 trước ngày bảo vệ
