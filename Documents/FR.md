# Functional Requirements (FR)

Tài liệu Đặc tả Yêu cầu Chức năng – được đồng bộ hóa với 46 Use Cases trong Documents.md.

## 1. Authentication & Profile

- **FR-AUTH-01:** Hệ thống cho phép khách truy cập đăng ký tài khoản mới bằng Email/Password (UC-01).
- **FR-AUTH-02:** Hệ thống cho phép đăng nhập qua Email/Password và cấp JWT Token (UC-02).
- **FR-AUTH-03:** Người dùng có thể đăng xuất và hệ thống hủy bỏ Refresh Token (UC-03).
- **FR-AUTH-04:** Chức năng thay đổi Avatar và thông tin hồ sơ bằng cách tải ảnh lên hệ thống (UC-04).

## 2. Workspace Management

- **FR-WS-01:** Hỗ trợ tính năng cơ bản của Workspace: Tạo mới, Lấy danh sách, Chỉnh sửa, Xóa (UC-05 đến UC-08).
- **FR-WS-02:** Owner có quyền mời thành viên mới qua email (UC-09) và có quyền thu hồi xóa thành viên khỏi workspace (UC-10).
- **FR-WS-03:** Member có thể tự do chủ động rời nhóm khi không còn đóng góp (UC-11).
- **FR-WS-04:** Flow Request (Yêu cầu) tham gia không gian làm việc bao gồm: Gửi yêu cầu qua link public/private, Hủy yêu cầu vừa gửi, Quản trị viên xử lý (Duyệt/Từ chối) (UC-12 đến UC-14).

## 3. Project Management

- **FR-PRJ-01:** Cung cấp chức năng Quản lý Project cấp độ cơ bản (CRUD) tại màn hình Dashboard Project (UC-15 đến UC-18).
- **FR-PRJ-02:** Cung cấp chức năng thêm, xóa đồng nghiệp đã có sẵn trong Workspace, thủ tục cho phép user tự nguyện rời khởi Project (UC-19 đến UC-21).
- **FR-PRJ-03:** Workflow xin gia nhập: Request duyệt thành viên vào một Project cụ thể đang ở trạng thái Private thay vì Public (UC-22 đến UC-24).

## 4. Task & Collaboration (Quản lý Công việc & Cộng tác)

- **FR-TSK-01:** Quản lý vòng đời cấu trúc Task: Tạo thẻ task mới, Cập nhật trạng thái/assignee/do-date, Tính năng Xóa/Lưu trữ (UC-25 đến UC-27).
- **FR-TSK-02:** Module Xem task: Hiển thị danh sách tổng hợp dạng List/Kanban board, Truy cập màn hình xem chi tiết mở rộng một task (UC-28, UC-29).
- **FR-TSK-03:** Collaborative features (cộng tác): Cho phép các User tag nhau và tương tác qua bình luận (Comment), tích hợp hệ thống lưu trữ Object Storage đính kèm Upload File tài liệu (UC-30, UC-31).

## 5. AI Business Support (Hỗ trợ AI phân tích)

- **FR-AI-01:** Gợi ý thông minh (Recommend): Ứng dụng AI phân tích ngữ cảnh, các thông số deadline, lịch sử tương tác để quyết định gợi ý "Task tiếp theo nên làm (Next Action) là gì" (UC-32).
- **FR-AI-02:** Quản lý sức khỏe công việc (Overload Warning): AI quét và nhận diện khối lượng công việc liên đới, cảnh báo Overload đẩy noti lên Project Manager (UC-33).

## 6. Reporting (Báo cáo tổng hợp)

- **FR-RPT-01:** Khả năng thống kê dữ liệu tiến độ định kỳ: Tổng hợp báo cáo completion rate, khối lượng burn-down (UC-34).

## 7. Workflow Knowledge Sharing (Chức năng Vốn Trí Tuệ)

- **FR-WF-01:** Trích xuất tự động thành quy trình chung: User là Contributor có quyền chuyển đổi Project mẫu thành Template (UC-35, UC-36).
- **FR-WF-02:** Tính năng Cộng đồng: Đăng public chia sẻ Workflow, duyệt khám phá quy trình của tổ chức, Đánh giá, Bình luận trao đổi vào các thiết kế mẫu của Contributor (UC-37 đến UC-41).
- **FR-WF-03:** Tính năng Tái sử dụng linh hoạt: Bookmark đánh dấu mẫu chất lượng cao, Triển khai khởi tạo nhân bản tự động dự án mới từ Template Workflow đã chọn (UC-42 đến UC-44).

## 8. Dashboard (Bảng điều khiển)

- **FR-DSH-01:** Project Dashboard: Trang thông tin tổng quan chỉ số chung cho một dự án cụ thể ở cấp người điều hành (UC-45).
- **FR-DSH-02:** Personal Dashboard (Trang cá nhân): Chế độ Personal Analytics để nhìn nhận khối lượng công việc quá hạn/đúng hạn của riêng một cá nhân (UC-46).
