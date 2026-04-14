# User Stories

Tài liệu này ánh xạ các chức năng thành User Stories theo danh sách 46 Use Cases thống nhất từ Documents.md.

## Epic 1: Authentication & User Profile

- **UC-01 - Đăng ký tài khoản**: Là khách truy cập, tôi muốn tạo tài khoản mới để bắt đầu sử dụng hệ thống.
- **UC-02 - Đăng nhập**: Là người dùng, tôi muốn đăng nhập để tiếp tục công việc của mình.
- **UC-03 - Đăng xuất**: Là người dùng, tôi muốn đăng xuất an toàn để bảo mật tài khoản.
- **UC-04 - Cập nhật thông tin cá nhân**: Là người dùng, tôi muốn điều chỉnh profile (đổi tên, avatar) để đồng nghiệp dễ nhận diện.

## Epic 2: Workspace Management

- **UC-05 - Tạo workspace**: Là người quản lý nhóm, tôi muốn tạo workspace để gom các dự án của mình vào một nơi.
- **UC-06 - Cập nhật workspace**: Là Workspace Owner, tôi muốn chỉnh sửa tên hiển thị và mô tả của không gian làm việc.
- **UC-07 - Xóa workspace**: Là Workspace Owner, tôi có quyền xóa toàn bộ workspace khi nhóm giải tán.
- **UC-08 - Xem danh sách workspace**: Là thành viên, tôi muốn truy cập nhanh danh sách các workspace tôi tham gia.
- **UC-09 - Thêm thành viên vào workspace**: Là Workspace Owner, tôi muốn gửi thư mời để người khác tham gia nhóm.
- **UC-10 - Xóa thành viên khỏi workspace**: Là Workspace Owner, tôi muốn thu hồi quyền truy cập của một nhân viên đã nghỉ.
- **UC-11 - Rời workspace**: Là thành viên, tôi muốn tự chủ động thoát khỏi các nhóm không còn phù hợp.
- **UC-12 - Yêu cầu tham gia workspace**: Là sinh viên mới, tôi muốn gửi request xin được thao tác trong workspace nghiên cứu.
- **UC-13 - Hủy yêu cầu tham gia workspace**: Là người gửi, tôi có thể hủy đơn xin phép của mình.
- **UC-14 - Xử lý yêu cầu tham gia workspace**: Là quản trị, tôi xét duyệt cấp quyền cho những request hợp lệ.

## Epic 3: Project Management

- **UC-15 - Tạo project**: Là quản lý, tôi muốn khởi tạo dự án để bắt đầu quản lý task.
- **UC-16 - Cập nhật project**: Là Project Manager, tôi muốn sửa mục tiêu dự án theo tình hình thực tế.
- **UC-17 - Xóa project**: Là Project Manager, tôi có quyền xóa dự án bị hủy ngang.
- **UC-18 - Xem danh sách project**: Là người dùng, tôi xem nhanh tất cả project có trong workspace.
- **UC-19 - Thêm thành viên vào project**: Là Project Manager, tôi kéo đồng nghiệp từ workspace vào dự án cụ thể.
- **UC-20 - Xóa thành viên khỏi project**: Là Project Manager, tôi thu hồi quyền làm việc trong project của họ.
- **UC-21 - Rời project**: Là thành viên, tôi rời dự án sau khi hoàn thành xong trách nhiệm.
- **UC-22 - Yêu cầu tham gia project**: Là thành viên, tôi xin cấp quyền vào xem một dự án private.
- **UC-23 - Hủy yêu cầu tham gia project**: Tôi rút lại yêu cầu vào project vừa gửi.
- **UC-24 - Xử lý yêu cầu tham gia project**: PM duyệt hoặc từ chối đơn xin tham gia.

## Epic 4: Task & Collaboration

- **UC-25 - Tạo task**: Là thành viên làm dự án, tôi mở công việc mới để theo dõi tiến độ công việc.
- **UC-26 - Cập nhật task**: Là người được giao, tôi muốn update lại trạng thái, chuyển assignee khi cần thiết.
- **UC-27 - Xóa task**: Là người tạo task, tôi xóa đi các phiếu việc dư thừa, lỗi.
- **UC-28 - Xem danh sách task**: Là thành viên, tôi muốn mở giao diện theo dạng list, kanban để view toàn cục.
- **UC-29 - Xem chi tiết task**: Là người làm task, tôi muốn mở chi tiết để đọc kĩ description.
- **UC-30 - Bình luận vào task**: Là đồng đội, tôi thả comment dưới task để cập nhật tình hình hoặc hỏi đáp.
- **UC-31 - Đính kèm file vào task**: Tôi upload file báo giá, đồ họa lên task để team cùng xem.

## Epic 5: AI Support

- **UC-32 - Gợi ý task nên thực hiện tiếp theo**: Là một cá nhân nhiều việc, tôi muốn AI phân tích deadline để tư vấn cho tôi việc cần làm ngay lúc này.
- **UC-33 - Cảnh báo overload**: Là Project Manager, tôi muốn nhận insight nếu có thành viên nào đang bị dồn dập vượt năng lực để tôi kịp thời điều phối.

## Epic 6: Reporting

- **UC-34 - Tạo báo cáo tiến độ**: Là tổ trưởng, tôi muốn gen được slide báo cáo về % hoàn thành của team vào tối cuối tuần.

## Epic 7: Workflow Sharing

- **UC-35 - Tạo workflow từ project**: Là một cá nhân giỏi về nghiệp vụ, tôi muốn biến cấu trúc dự án của tôi thành Workflow Template mẫu.
- **UC-36 - Chỉnh sửa workflow**: Tôi muốn cấu hình lại các description của mẫu để nó tổng quát hóa.
- **UC-37 - Chia sẻ workflow**: Tôi thiết lập chế độ Public để mẫu của mình xuất hiện tại kho cộng đồng.
- **UC-38 - Khám phá workflow**: Là sinh viên mới tập làm quản lý, tôi tìm kiếm các template xịn được đánh giá tốt.
- **UC-39 - Xem chi tiết workflow**: Tôi mở xem toàn cảnh số lượng task có trong một cái workflow chia sẻ.
- **UC-40 - Đánh giá workflow**: Tôi vote 5 sao cho mẫu quy trình hữu ích này.
- **UC-41 - Bình luận workflow**: Tôi muốn hỏi tác giả của workflow về ý nghĩa áp dụng của 1 task.
- **UC-42 - Lưu workflow yêu thích**: Tôi đính dấu trang cho workflow này lại để sau này nhớ.
- **UC-43 - Tạo project từ workflow**: Tôi clone quy trình mẫu để tạo thành Project Workspace 1-1 ngay tức thì.
- **UC-44 - Xem workflow đã đăng**: Tôi mở danh sách quản lý những bản workflow mà mình đã đóng góp.

## Epic 8: Dashboards

- **UC-45 - Xem dashboard project**: Là người quản lý hoặc thành viên, tôi nhìn biểu đồ số liệu tổng kết ngay ngoài màn hình project.
- **UC-46 - Xem dashboard cá nhân**: Là cá nhân tôi, tôi theo dõi tốc độ và khối lượng công việc được giao của mình.
