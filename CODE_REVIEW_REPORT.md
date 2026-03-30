# KẾ HOẠCH FIX + BÁO CÁO PHẢN BIỆN CODE - TaskSense

## (Cập nhật lần 3 - 2026-03-30)

> **Ngày review lần 1:** 2026-03-10  
> **Ngày review lần 2:** 2026-03-13  
> **Ngày review lần 3 (hiện tại):** 2026-03-30  
> **Phạm vi:** Toàn bộ `server` (Spring Boot) + `client` (React/TypeScript), đối chiếu `Documents/Documents.md`, `Documents/usecase/*`, và report cũ.  
> **Mục tiêu:** Đánh giá production-readiness theo các tiêu chí: bảo mật, nghiệp vụ/tính toàn vẹn, hiệu năng, resilience, code quality, testability, kiến trúc, độ phủ usecase, observability, deploy readiness.

---

## MỤC LỤC

1. [PLAN FIX (Ưu tiên triển khai)](#1-plan-fix-ưu-tiên-triển-khai)
2. [BÁO CÁO PHẢN BIỆN CHI TIẾT](#2-báo-cáo-phản-biện-chi-tiết)
3. [Q&A phản biện dự kiến](#3-qa-phản-biện-dự-kiến)

---

## 1) PLAN FIX (Ưu tiên triển khai)

## 1.1 Fix NGAY (2-4 giờ)

- [ ] **Fix bug reset password key mismatch**  
  `AuthServiceImpl.resetPassword()` dùng `RedisKeys.resetToken(...)` thay vì `RedisKeys.refreshToken(...)`.
- [ ] **Bỏ hardcoded secrets/credentials** trong `application.yaml` (JWT secret, DB user/pass) -> chuyển env.
- [ ] **Tắt `org.springframework.security: DEBUG`** ở profile production.
- [ ] **Thêm `@Valid` cho auth endpoints** (`register/login/refresh/reset/logout`) + bổ sung validation cho `AuthRequest` (`@Email`, password policy).
- [ ] **Ẩn 4 route placeholder khỏi sidebar** (`/tasks`, `/calendar`, `/analytics`, `/settings`) nếu chưa implement.

## 1.2 Ổn định lõi (1-2 ngày)

- [ ] **Refresh-token rotation** ở server + revoke token cũ atomically.
- [ ] **Token refresh interceptor** ở client (401 -> refresh -> retry).
- [ ] **Chuẩn hóa CORS**: chỉ giữ một nguồn config, bỏ wildcard.
- [ ] **Refactor client API architecture**: base API chung + `injectEndpoints`.
- [ ] **Gom constants pagination** thay cho hardcoded size/limit.
- [ ] **Dọn `System.out/err` + sửa typo package `subcriber`**.

## 1.3 Production-ready tối thiểu (3-5 ngày)

- [ ] **Sửa reliability outbox/email**: ack/retry/DLQ rõ ràng; tránh mark SUCCESS quá sớm.
- [ ] **Tối ưu N+1** ở `resolveAssignees`.
- [ ] **Thiết lập test baseline** (server + client).
- [ ] **Đồng bộ usecase docs với implementation**: workflow (UC-35..44), AI support (UC-32/33), personal analytics (UC-46).

## 1.4 Độ ưu tiên kỹ thuật (Top 10)

1. Reset password key mismatch (Critical business bug)
2. Hardcoded JWT/DB credentials
3. Auth validation + `@Valid`
4. Refresh token rotation
5. Client refresh interceptor
6. Outbox/email delivery consistency
7. CORS config cleanup
8. Hide placeholder routes / feature flags
9. N+1 task assignee queries
10. Testing baseline

---

## 2) BÁO CÁO PHẢN BIỆN CHI TIẾT

## 2.1 Tóm tắt điều hành

- Dự án có nền tảng tốt (module rõ ràng, RBAC, outbox, realtime, pagination, feature set task/workspace/project tương đối đầy đủ).
- Tuy nhiên còn **3 nhóm rủi ro rất cao** trước khi demo/bảo vệ:
  1. **Security baseline chưa đạt** (hardcoded secrets, auth validation yếu, token lifecycle chưa an toàn).
  2. **Bug nghiệp vụ sống còn**: reset password hiện tại bị hỏng do đọc sai Redis key.
  3. **Resilience pipeline email/outbox chưa đảm bảo delivery thực tế** (có thể đánh dấu SUCCESS nhưng email fail ở subscriber).
- Client còn **technical debt kiến trúc API** (19 `createApi` rời rạc), và **4 route placeholder** vẫn hiển thị trong navigation.
- Tài liệu usecase và implementation có lệch đáng kể ở mảng **Workflow/AI/Personal Analytics**.

---

## 2.2 Phương pháp review

1. Đọc context nghiệp vụ: `Documents/Documents.md`, `Documents/usecase/UseCases.md`, `UserStories.md`, `UserFlows.md`.
2. Đọc report cũ: `CODE_REVIEW_REPORT.md`.
3. Quét toàn bộ mã nguồn `server` và `client` với evidence theo file/line.
4. Đối chiếu từng issue cũ: còn tồn tại / đã fix / thay đổi mức độ.
5. Tổng hợp severity + roadmap hành động theo effort.

---

## 2.3 Đối chiếu nhanh với report cũ (trạng thái hiện tại)

| Issue cũ | Trạng thái lần 3 | Bằng chứng |
|---|---|---|
| Hardcoded JWT secret | ❌ Còn | `server/src/main/resources/application.yaml:72` |
| Hardcoded DB credentials | ❌ Còn | `server/src/main/resources/application.yaml:9-10` |
| OTP dùng `SecureRandom` | ✅ Đã fix | `server/.../AuthServiceImpl.java:139` |
| Thiếu rate limiting auth endpoints | ❌ Còn | Không có cấu hình/annotation rate limit; không có dependency tương ứng trong `server/pom.xml` |
| Thiếu validation Auth + thiếu `@Valid` | ❌ Còn | `AuthRequest.java:10-13`, `AuthController.java:21,43,55,91,109` |
| Refresh token không rotate | ❌ Còn | `AuthServiceImpl.java:126-129` |
| Bug resetPassword sai Redis key | ❌ Còn (Critical) | `AuthServiceImpl.java:186-189` vs `199` |
| N+1 ở resolveAssignees | ❌ Còn | `TaskServiceImpl.java:95-101` |
| System.out/err nhiều | ❌ Còn | 15 matches trong server |
| 4 trang placeholder client | ❌ Còn | `client/src/routes/index.tsx:130-143` |
| Google Client ID placeholder check | ✅ Đã cải thiện | `LoginPage.tsx:123-126`, `RegisterPage.tsx:133-136` |

---

## 2.4 Findings theo mức độ nghiêm trọng

## 2.4.1 CRITICAL

### C-01. Hardcoded secrets + debug/security config không an toàn

**Evidence**
- `server/src/main/resources/application.yaml:9-10`
  - `username: postgres`
  - `password: postgres`
- `server/src/main/resources/application.yaml:72`
  - `security.jwt.secret: my-super-secret-key-...`
- `server/src/main/resources/application.yaml:82`
  - `org.springframework.security: DEBUG`

**Tác động**
- Lộ secret/credential, tăng nguy cơ chiếm quyền nếu config bị rò rỉ.
- Debug security log trong runtime thật có thể làm lộ thông tin nhạy cảm.

**Risk khi demo/bảo vệ**
- Bị phản biện trực diện về security hygiene và readiness production.

**Khuyến nghị**
- Chuyển toàn bộ secret sang env/secret manager, không default nguy hiểm.
- Tách profile `dev/staging/prod`, tắt security DEBUG ở `prod`.

---

### C-02. BUG nghiệp vụ: reset password đọc sai Redis key

**Evidence**
- `server/src/main/java/dev/alro127/tasksense/service/impl/AuthServiceImpl.java`
  - `forgotPassword()` lưu `RedisKeys.resetToken(hashedToken)` (`186-189`)
  - `resetPassword()` lại đọc `RedisKeys.refreshToken(hashedToken)` (`199`)

**Tác động**
- Flow reset password có thể fail hoàn toàn (token reset không bao giờ match key đã lưu).

**Risk khi demo/bảo vệ**
- Demo “quên mật khẩu” có xác suất fail cao, ảnh hưởng nghiêm trọng điểm nghiệp vụ.

**Khuyến nghị**
- Đổi line 199 sang `RedisKeys.resetToken(hashedToken)`.
- Bổ sung integration test cho full flow: forgot → email token → reset.

---

### C-03. Resilience lỗi: outbox có thể đánh dấu SUCCESS dù email thật không gửi

**Evidence**
- `server/.../worker/outbox/OutboxEventProcessor.java:41-44`
  - publish xong Redis là set `DeliveryStatus.SUCCESS`.
- `server/.../service/subcriber/EmailSubscriber.java:46-48`
  - Bắt exception rồi `System.err.println`, không retry/DLQ/ack chuẩn.

**Tác động**
- Sai lệch trạng thái hệ thống: DB nghĩ đã gửi, nhưng email thật có thể thất bại.

**Risk khi demo/bảo vệ**
- Hành vi không ổn định ở notification/email, khó truy vết nguyên nhân.

**Khuyến nghị**
- Dùng cơ chế có ack/retry (Redis Streams/RabbitMQ), hoặc thiết kế retry workflow ở consumer với trạng thái fail rõ ràng.
- Thay toàn bộ `System.err` bằng structured logging + alerting.

---

## 2.4.2 HIGH

### H-01. Validation auth còn yếu (DTO + Controller)

**Evidence**
- `server/.../dto/request/AuthRequest.java:10-13` chỉ `@NonNull` cho email/password.
- `server/.../controller/AuthController.java:21,43,55,91,109` thiếu `@Valid`.

**Tác động**
- Dễ nhận input không hợp lệ; policy password/email chưa enforce ở backend.

**Khuyến nghị**
- Dùng Jakarta Validation (`@Email`, `@NotBlank`, `@Size`, regex password policy).
- Thêm `@Valid` cho toàn bộ request body auth endpoints.

---

### H-02. Refresh token chưa rotate

**Evidence**
- `server/.../AuthServiceImpl.java:126-129` trả lại token cũ (`request.getToken()`).

**Tác động**
- Tăng rủi ro replay/reuse khi refresh token bị lộ.

**Khuyến nghị**
- Mỗi lần refresh: phát token mới + revoke token cũ atomically.

---

### H-03. Google OAuth user tạo với password rỗng, chưa tách provider rõ

**Evidence**
- `server/.../AuthServiceImpl.java:239-244` dùng `.password("")`.

**Tác động**
- Identity model mơ hồ (local vs social), dễ phát sinh lỗi auth policy.

**Khuyến nghị**
- Thêm `authProvider` (LOCAL/GOOGLE), để password nullable cho social.
- Chặn local login cho social account nếu chưa set password riêng.

---

### H-04. CORS cấu hình trùng + còn wildcard

**Evidence**
- `server/.../config/security/CorsConfig.java:30,32,34` có wildcard.
- Đồng thời class này còn cấu hình thêm `CorsConfigurationSource` (2 nguồn chính sách).

**Tác động**
- Khó kiểm soát behavior CORS, tăng attack surface.

**Khuyến nghị**
- Chuẩn hóa **1 nguồn CORS config** duy nhất; whitelist methods/headers/exposed headers rõ ràng theo env.

---

### H-05. Client auth/session architecture chưa an toàn và thiếu re-auth flow

**Evidence**
- `client/src/features/auth/authSlice.ts:11-13,29-30`
  - Access/refresh token lưu localStorage.
  - `isAuthenticated` chỉ check token tồn tại.
- `client/src/features/auth/api/authApi.ts` không có endpoint refresh.
- Không có interceptor 401→refresh→retry ở client.

**Tác động**
- Rủi ro XSS token theft; UX dễ fail khi token hết hạn.

**Khuyến nghị**
- Dùng baseQueryWithReauth.
- Cân nhắc refresh token qua httpOnly cookie, access token in-memory.

---

### H-06. Lệch usecase-docs và implementation ở nhóm Workflow/AI

**Evidence**
- Docs yêu cầu UC-35..44 theo **workflow**.
- Code hiện có module **team-template** (đây là tính năng khác, không phải workflow):
  - `server/.../controller/TeamTemplateController.java`
  - `client/src/features/team-template/*`
- Không tìm thấy module `workflow` rõ ràng.

**Tác động**
- Traceability học thuật kém (khó map UC ↔ API/UI khi phản biện).

**Khuyến nghị**
- Giữ `team-template` là module riêng. Bổ sung module/route/API `workflow` đúng theo UC-35..44 hoặc cập nhật phạm vi UC đã loại trừ trong luận văn.

---

## 2.4.3 MEDIUM

### M-01. N+1 query ở resolveAssignees

**Evidence**
- `server/.../TaskServiceImpl.java:95-101`
  - Mỗi assignee gọi `findById` + `existsByProjectIdAndUserId`.

**Tác động**
- Tăng query tuyến tính theo số assignee.

**Khuyến nghị**
- Batch load users + membership set rồi validate in-memory.

---

### M-02. Thiếu validation nghiệp vụ `startDate/endDate` cho project

**Evidence**
- `server/.../dto/request/CreateProjectRequest.java:22,24`
- `server/.../dto/request/UpdateProjectRequest.java:20,22`
- `server/.../service/impl/ProjectServiceImpl.java:69-70,176-180` set trực tiếp, không check quan hệ ngày.

**Tác động**
- Có thể tạo/cập nhật project với mốc thời gian không hợp lệ.

**Khuyến nghị**
- Thêm class-level validator `startDate <= endDate` + check service layer.

---

### M-03. 4 route placeholder vẫn public trong navigation

**Evidence**
- `client/src/routes/index.tsx:130-143` (`/tasks`, `/calendar`, `/analytics`, `/settings`)
- `client/src/layouts/MainLayout.tsx:36-40` sidebar vẫn hiển thị.

**Tác động**
- UX hụt kỳ vọng; dễ bị hỏi vì sao feature đã xuất hiện nhưng chưa implement.

**Khuyến nghị**
- Ẩn theo feature flag hoặc gắn trạng thái “Coming soon”.

---

### M-04. API client phân mảnh (19 `createApi`) + duplicate base/header

**Evidence**
- 19 file API dùng `createApi` riêng, lặp `VITE_API_BASE_URL`, lặp `prepareHeaders`.

**Tác động**
- Khó maintain và khó áp chính sách auth/error handling nhất quán.

**Khuyến nghị**
- Gom về API root chung + `injectEndpoints`, hoặc shared base query.

---

### M-05. Hardcoded pagination sizes rải rác

**Evidence**
- 14 vị trí `size/limit` cứng (ví dụ `taskApi.ts`, `workspaceApi.ts`, `notificationApi.ts`, `commentApi.ts`, `teamTemplateApi.ts`).

**Tác động**
- Khó tuning và thiếu consistency.

**Khuyến nghị**
- Tạo constants/config chung cho paging defaults.

---

### M-06. Nested `GoogleOAuthProvider`

**Evidence**
- `client/src/main.tsx:13`
- `client/src/App.tsx:10`

**Tác động**
- Tăng độ phức tạp context OAuth không cần thiết.

**Khuyến nghị**
- Giữ 1 provider tại root duy nhất.

---

### M-07. WebSocket fallback dùng `ws://` (non-TLS)

**Evidence**
- `client/src/features/notification/hooks/useNotificationSocket.ts:15-16`

**Tác động**
- Dễ lỗi cấu hình khi deploy; không phù hợp chuẩn production HTTPS.

**Khuyến nghị**
- Bắt buộc `wss://` cho môi trường non-local, fail-fast nếu thiếu env.

---

### M-08. Code hygiene: `System.out/err` còn nhiều + typo package

**Evidence**
- 15 vị trí `System.out/err.println` trong server (workers/services/subscribers).
- Typo package: `server/.../service/subcriber/*`.

**Tác động**
- Logging khó quan sát, giảm tính chuyên nghiệp codebase.

**Khuyến nghị**
- Chuẩn hóa SLF4J + đổi package `subcriber` → `subscriber`.

---

## 2.4.4 LOW

### L-01. Testing coverage rất thấp

**Evidence**
- Server chỉ có: `server/src/test/.../TaskSenseApplicationTests.java:9-11` (`contextLoads`).
- Client chưa có script test trong `client/package.json:6-11`, không có test files.

**Tác động**
- Regression risk cao khi refactor.

**Khuyến nghị**
- Tối thiểu: test auth flows, permission matrix, outbox processing, và 1-2 UI flow quan trọng.

---

## 2.5 Độ phủ usecase so với tài liệu

## 5.1 Đã có nền tảng/đã triển khai đáng kể
- Core auth/workspace/project/task/comment/attachment/tag/sprint đã hiện diện trong server + client.
- Analytics cấp project có endpoint + UI tab:
  - `server/.../controller/AnalyticsController.java`
  - `client/.../features/analytics/components/ProjectAnalyticsTab.tsx`

## 5.2 Lệch hoặc thiếu rõ ràng
- **UC-35..UC-44**: tài liệu dùng “workflow”, code dùng “team-template” (nên đồng bộ thuật ngữ và traceability).
- **UC-32/UC-33 (AI suggest/overload)**: chưa thấy module/route rõ ràng theo tài liệu.
- **UC-46 (dashboard cá nhân/analytics cá nhân)**: route `/analytics` vẫn placeholder (`client/src/routes/index.tsx:138-140`).

---

## 2.6 Ma trận đánh giá tổng hợp (lần 3)

| Tiêu chí | Điểm / 10 | Nhận định |
|---|:---:|---|
| Security | **3.5** | Còn hardcoded secret/cred, auth validation yếu, token lifecycle chưa chuẩn |
| Integrity (nghiệp vụ/dữ liệu) | **4.0** | Có bug reset password + trạng thái outbox/email chưa nhất quán |
| Performance | **6.0** | Tổng thể ổn cho demo nhỏ, còn N+1 tại assign task |
| Resilience | **3.5** | Email pipeline chưa có retry/ack/DLQ đủ mạnh |
| Code Quality | **5.0** | Kiến trúc có tổ chức nhưng hygiene và duplication còn nhiều |
| Testing | **2.0** | Thiếu test tự động có ý nghĩa |
| Architecture Coherence | **5.0** | Nền tảng tốt nhưng client API phân mảnh, docs-code lệch domain |
| Usecase Coverage | **4.0** | Core tốt, nhưng AI/workflow/personal analytics lệch hoặc chưa hoàn chỉnh |
| Observability (đề xuất thêm) | **4.0** | Logging chưa chuẩn, thiếu monitoring/error strategy rõ |
| Deploy Readiness (đề xuất thêm) | **3.5** | Chưa tách profile đầy đủ, còn config dev-like trong runtime config |

---

## 2.7 Điểm tích cực ghi nhận

- OTP đã dùng `SecureRandom` đúng chuẩn.
- Redis timeout đã giảm về `5000ms` (tốt hơn trước).
- Feature set hợp tác đã mở rộng đáng kể: comments/reactions, attachments, sprint, tags, analytics theo project.
- Permission framework (resolver/policy) được tách lớp rõ và có cache permission.

---

## 2.8 Câu hỏi cần xác nhận với nhóm dự án

1. **Scope bảo vệ có bao gồm UC-32/33/46 không?** (AI suggest/overload/personal analytics) để quyết định “implement vs tạm loại khỏi scope”.
2. **Chiến lược auth mục tiêu cho phiên bản demo là gì?** (giữ localStorage tạm thời hay chuyển refresh cookie + reauth flow chuẩn).

---

## 3) Q&A phản biện dự kiến

### Q1. “Tại sao route đang hiện nhưng nhiều trang là placeholder?”
- Trả lời ngắn: Đây là phần roadmap UI đã dựng khung điều hướng. Trước demo chính thức sẽ ẩn theo feature flag hoặc implement tối thiểu `My Tasks` và `Analytics`.

### Q2. “Workflow UC-35..44 đang ở đâu?”
- Trả lời ngắn: `team-template` là module khác, không phải workflow. Workflow module theo UC-35..44 chưa hoàn tất/đang tách phase, cần nêu rõ phạm vi và lộ trình.

### Q3. “Vì sao reset password có thể fail?”
- Trả lời ngắn: Có bug mapping Redis key giữa forgot/reset. Đã xác định chính xác root cause và có patch fix 1-line + test integration kèm theo.

### Q4. “Token management hiện tại có an toàn chưa?”
- Trả lời ngắn: Chưa production-grade. Cần refresh rotation + interceptor re-auth + cân nhắc refresh token httpOnly cookie.

### Q5. “Hệ thống đã production-ready chưa?”
- Trả lời ngắn: Chưa. Core nghiệp vụ chạy được nhưng còn thiếu hardening (security config, resilience email/outbox, testing baseline).
