1. # **Stakeholders & Actors**
   1. ## **Stakeholders chính**

- **Sinh viên (End User)**: sử dụng hệ thống để quản lý task & học cách quản lý
- **Nhóm sinh viên (Team)**: cộng tác trong project
- **Người có kinh nghiệm (Contributor)**: chia sẻ workflow, kinh nghiệm 2. ## **Actors trong hệ thống**

- **Guest**
- **Authenticated User**

2. # **DANH SÁCH USE CASE**

- UC-01: Đăng ký tài khoản
- UC-02: Đăng nhập
- UC-03: Đăng xuất
- UC-04: Cập nhật thông tin cá nhân
- UC-05: Tạo workspace
- UC-06: Cập nhật workspace
- UC-07: Xóa workspace
- UC-08: Xem danh sách workspace
- UC-09: Thêm thành viên vào workspace
- UC-10: Xóa thành viên khỏi workspace
- UC-11: Rời workspace
- UC-12: Yêu cầu tham gia workspace
- UC-13: Hủy yêu cầu tham gia workspace
- UC-14: Xử lý yêu cầu tham gia workspace
- UC-15: Tạo project
- UC-16: Cập nhật project
- UC-17: Xóa project
- UC-18: Xem danh sách project
- UC-19: Thêm thành viên vào project
- UC-20: Xóa thành viên khỏi project
- UC-21: Rời project
- UC-22: Yêu cầu tham gia project
- UC-23: Hủy yêu cầu tham gia project
- UC-24: Xử lý yêu cầu tham gia project
- UC-25: Tạo task
- UC-26: Cập nhật task
- UC-27: Xóa task
- UC-28: Xem danh sách task
- UC-29: Xem chi tiết task
- UC-30: Bình luận vào task
- UC-31: Đính kèm file vào task
- UC-32: Gợi ý task nên thực hiện tiếp theo
- UC-33: Cảnh báo overload
- UC-34: Tạo báo cáo tiến độ
- UC-35: Tạo workflow từ project
- UC-36: Chỉnh sửa workflow
- UC-37: Chia sẻ workflow
- UC-38: Khám phá workflow
- UC-39: Xem chi tiết workflow
- UC-40: Đánh giá workflow
- UC-41: Bình luận workflow
- UC-42: Lưu workflow yêu thích
- UC-43: Tạo project từ workflow
- UC-44: Xem workflow đã đăng
- UC-45: Xem dashboard project
- UC-46: Xem dashboard cá nhân

3. # **DANH SÁCH USE CASE SPECIFICATION**
   1. ## **UC-01 Đăng ký tài khoản**

| Use case ID         | UC-01                                                                                                                                                                              |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Đăng ký tài khoản                                                                                                                                                                  |
| **Mô tả**           | Cho phép người dùng tạo tài khoản mới trong hệ thống                                                                                                                               |
| **Tác nhân**        | Guest                                                                                                                                                                              |
| **Điều kiện trước** | Người dùng chưa đăng nhập                                                                                                                                                          |
| **Điều kiện sau**   | Tài khoản được tạo thành công                                                                                                                                                      |
| **Luồng chính**     | Người dùng truy cập trang đăng ký Người dùng nhập thông tin Người dùng gửi form đăng ký Hệ thống kiểm tra tính hợp lệ dữ liệu Hệ thống tạo tài khoản Hệ thống thông báo thành công |
| **Luồng thay thế**  | **A1: Đăng ký qua OAuth (Google)** Người dùng chọn đăng ký bằng OAuth Hệ thống chuyển hướng đến nhà cung cấp Người dùng xác thực Hệ thống nhận thông tin và tạo tài khoản          |
|                     |                                                                                                                                                                                    |
| **Luồng ngoại lệ**  | **E1: Email đã tồn tại** → Hệ thống thông báo lỗi **E2: Dữ liệu không hợp lệ (format email, password yếu)** → Hệ thống từ chối và yêu cầu nhập lại                                 |

2.  ## **UC-02: Đăng nhập**

| Use case ID         | UC-02                                                                                                                                        |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Đăng nhập                                                                                                                                    |
| **Mô tả**           | Cho phép người dùng đăng nhập                                                                                                                |
| **Tác nhân**        | Guest                                                                                                                                        |
| **Điều kiện trước** | Người dùng có tài khoản                                                                                                                      |
| **Điều kiện sau**   | Người dùng đăng nhập thành công                                                                                                              |
| **Luồng chính**     | Người dùng nhập email và mật khẩu Người dùng gửi yêu cầu đăng nhập Hệ thống xác thực Hệ thống tạo session/token Hệ thống chuyển vào hệ thống |
| **Luồng thay thế**  | **A1: Đăng nhập bằng OAuth** Người dùng chọn OAuth Hệ thống redirect Người dùng xác thực Hệ thống đăng nhập                                  |
|                     |                                                                                                                                              |
| **Luồng ngoại lệ**  | **E1: Sai thông tin đăng nhập** → Thông báo lỗi **E2: Lỗi đăng nhập bên thứ 3** → Không cho đăng nhập                                        |

3.  ## **UC-03: Đăng xuất**

| Use case ID         | UC-03                                                                            |
| :------------------ | :------------------------------------------------------------------------------- |
| **Tên chức năng**   | Đăng xuất                                                                        |
| **Mô tả**           | Cho phép người dùng đăng xuất khỏi hệ thống                                      |
| **Tác nhân**        | User                                                                             |
| **Điều kiện trước** | Người dùng đã đăng nhập                                                          |
| **Điều kiện sau**   | Người dùng đăng xuất khỏi hệ thống                                               |
| **Luồng chính**     | Người dùng chọn logout Hệ thống xóa session/token Chuyển về trang login          |
| **Luồng thay thế**  | Không có                                                                         |
|                     |                                                                                  |
| **Luồng ngoại lệ**  | **E1: Token đã hết hạn / không hợp lệ** → Hệ thống vẫn coi như logout thành công |

4.  ## **UC-04: Cập nhật thông tin cá nhân**

| Use case ID         | UC-04                                                                                                         |
| :------------------ | :------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Cập nhật thông tin cá nhân                                                                                    |
| **Mô tả**           | Cho phép người dùng cập nhật hồ sơ cá nhân                                                                    |
| **Tác nhân**        | User                                                                                                          |
| **Điều kiện trước** | Người dùng đã đăng nhập                                                                                       |
| **Điều kiện sau**   | Thông tin được cập nhật                                                                                       |
| **Luồng chính**     | Người dùng mở trang profile Người dùng chỉnh sửa thông tin Người dùng lưu Hệ thống validate Hệ thống cập nhật |
| **Luồng thay thế**  |                                                                                                               |
|                     |                                                                                                               |
| **Luồng ngoại lệ**  | **E1: File avatar không hợp lệ** → Từ chối upload **E2: Dữ liệu không hợp lệ** → Không cập nhật               |

5.  ## **UC-05: Tạo workspace**

| Use case ID         | UC-05                                                                                                                       |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Tạo workspace                                                                                                               |
| **Mô tả**           | Cho phép tạo workspace để quản lý project                                                                                   |
| **Tác nhân**        | User                                                                                                                        |
| **Điều kiện trước** | Đã đăng nhập                                                                                                                |
| **Điều kiện sau**   | Workspace được tạo User là owner                                                                                            |
| **Luồng chính**     | Người dùng chọn tạo workspace Nhập tên workspace Xác nhận tạo Hệ thống validate Hệ thống tạo workspace và gán user là owner |
| **Luồng thay thế**  |                                                                                                                             |
|                     |                                                                                                                             |
| **Luồng ngoại lệ**  | **E1: Tên workspace không hợp lệ / trống** → Yêu cầu nhập lại **E2: Lỗi hệ thống khi lưu DB** → Thông báo thất bại          |

6.  ## **UC-06: Cập nhật workspace**

| Use case ID         | UC-06                                                                                                                                                     |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Cập nhật workspace                                                                                                                                        |
| **Mô tả**           | Cho phép chỉnh sửa thông tin workspace                                                                                                                    |
| **Tác nhân**        | User (Owner workspace)                                                                                                                                    |
| **Điều kiện trước** | Người dùng đã đăng nhập Có quyền chỉnh sửa workspace                                                                                                      |
| **Điều kiện sau**   | Thông tin workspace được cập nhật                                                                                                                         |
| **Luồng chính**     | Người dùng truy cập trang workspace settings Người dùng chỉnh sửa thông tin Người dùng lưu thay đổi Hệ thống kiểm tra dữ liệu Hệ thống cập nhật workspace |
| **Luồng thay thế**  |                                                                                                                                                           |
|                     |                                                                                                                                                           |
| **Luồng ngoại lệ**  | **E1: Không có quyền chỉnh sửa** → Hệ thống từ chối **E2: Dữ liệu không hợp lệ** → Không cập nhật                                                         |

7.  ## **UC-07: Xóa workspace**

| Use case ID         | UC-07                                                                                              |
| :------------------ | :------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Xóa workspace                                                                                      |
| **Mô tả**           | Cho phép xóa workspace và toàn bộ dữ liệu liên quan                                                |
| **Tác nhân**        | User (Owner)                                                                                       |
| **Điều kiện trước** | Người dùng là owner của workspace                                                                  |
| **Điều kiện sau**   | Workspace bị xóa khỏi hệ thống                                                                     |
| **Luồng chính**     | Người dùng chọn xóa workspace Hệ thống yêu cầu xác nhận Người dùng xác nhận Hệ thống xóa workspace |
| **Luồng thay thế**  | **A1: Hủy thao tác xóa** Người dùng chọn cancel Hệ thống giữ nguyên workspace                      |
|                     |                                                                                                    |
| **Luồng ngoại lệ**  | **E1: Không phải owner** → Không cho phép xóa **E2: Lỗi khi xóa dữ liệu** → Thông báo thất bại     |

8.  ## **UC-08: Xem danh sách workspace**

| Use case ID         | UC-08                                                                                                            |
| :------------------ | :--------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Xem danh sách workspace                                                                                          |
| **Mô tả**           | Cho phép người dùng xem các workspace mình tham gia                                                              |
| **Tác nhân**        | User                                                                                                             |
| **Điều kiện trước** | Người dùng đã đăng nhập                                                                                          |
| **Điều kiện sau**   | Danh sách workspace được hiển thị                                                                                |
| **Luồng chính**     | Người dùng truy cập dashboard Hệ thống lấy danh sách workspace Hệ thống hiển thị                                 |
| **Luồng thay thế**  | Không có                                                                                                         |
|                     |                                                                                                                  |
| **Luồng ngoại lệ**  | **E1: Không có workspace nào** → Hiển thị trạng thái empty **E2: Lỗi hệ thống khi load dữ liệu** → Thông báo lỗi |

9.  ## **UC-09: Thêm thành viên vào workspace**

| Use case ID         | UC-09                                                                                                                                       |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Thêm thành viên vào workspace                                                                                                               |
| **Mô tả**           | Cho phép thêm người dùng khác vào workspace                                                                                                 |
| **Tác nhân**        | User (Owner/ Manager)                                                                                                                       |
| **Điều kiện trước** | Người dùng có quyền quản lý thành viên                                                                                                      |
| **Điều kiện sau**   | Thành viên được thêm vào workspace                                                                                                          |
| **Luồng chính**     | Người dùng nhập email người cần thêm Người dùng xác nhận thêm Hệ thống kiểm tra user tồn tại Hệ thống gửi invitation về mail của người nhận |
| **Luồng thay thế**  | Không có                                                                                                                                    |
|                     |                                                                                                                                             |
| **Luồng ngoại lệ**  | **E1: User không tồn tại** → Thông báo lỗi **E2: User đã trong workspace** → Không thêm lại **E3: Không có quyền** → Từ chối                |

10. ## **UC-10: Xóa thành viên khỏi workspace**

| Use case ID         | UC-10                                                                                                |
| :------------------ | :--------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Xóa thành viên khỏi workspace                                                                        |
| **Mô tả**           | Cho phép loại bỏ một thành viên khỏi workspace                                                       |
| **Tác nhân**        | User (Owner)                                                                                         |
| **Điều kiện trước** | Có quyền quản lý thành viên                                                                          |
| **Điều kiện sau**   | Thành viên bị xóa khỏi workspace                                                                     |
| **Luồng chính**     | Người dùng chọn thành viên Người dùng chọn remove Hệ thống xác nhận Hệ thống xóa thành viên          |
| **Luồng thay thế**  | Không có                                                                                             |
|                     |                                                                                                      |
| **Luồng ngoại lệ**  | **E1: Không có quyền** → Không cho thực hiện **E2: Xóa owner** → Bị chặn, yêu cầu transfer ownership |

11. ## **UC-11 Rời workspace**

| Use case ID         | UC-11                                                                                                          |
| :------------------ | :------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Rời workspace                                                                                                  |
| **Mô tả**           | Cho phép thành viên tự rời khỏi workspace                                                                      |
| **Tác nhân**        | User                                                                                                           |
| **Điều kiện trước** | User đã đăng nhập User là thành viên của workspace                                                             |
| **Điều kiện sau**   | User bị xóa khỏi workspace                                                                                     |
| **Luồng chính**     | Người dùng chọn “Rời workspace” Hệ thống yêu cầu xác nhận Người dùng xác nhận Hệ thống xóa user khỏi workspace |
| **Luồng thay thế**  | Không có                                                                                                       |
| **Luồng ngoại lệ**  |                                                                                                                |

12. ## **UC-12 Yêu cầu tham gia workspace**

| Use case ID         | UC-12                                                                                                                                                                                             |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Yêu cầu tham gia workspace                                                                                                                                                                        |
| **Mô tả**           | Cho phép người dùng gửi yêu cầu tham gia một workspace mà họ chưa phải là thành viên.                                                                                                             |
| **Tác nhân**        | User                                                                                                                                                                                              |
| **Điều kiện trước** | User đã đăng nhập. User chưa là thành viên của workspace. Workspace có cấu hình cho phép yêu cầu tham gia.                                                                                        |
| **Điều kiện sau**   | Yêu cầu tham gia được gửi đi và chờ Chủ workspace/Quản lý xử lý.                                                                                                                                  |
| **Luồng chính**     | Người dùng tìm kiếm và chọn workspace muốn tham gia. Người dùng chọn "Yêu cầu tham gia". Hệ thống kiểm tra điều kiện. Hệ thống ghi nhận yêu cầu và gửi thông báo đến Owner/Manager của workspace. |
| **Luồng thay thế**  | **A1: Workspace yêu cầu mật khẩu/mã mời** Người dùng nhập mật khẩu/mã mời. Hệ thống xác thực. Nếu thành công, thêm user vào workspace (bỏ qua bước xử lý yêu cầu).                                |
| **Luồng ngoại lệ**  | **E1: User đã là thành viên** → Hệ thống thông báo lỗi.                                                                                                                                           |

13. ## **UC-13 Hủy yêu cầu tham gia workspace**

| Use case ID         | UC-13                                                                                                                                                          |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | **Hủy yêu cầu tham gia workspace**                                                                                                                             |
| **Mô tả**           | Cho phép người dùng hủy bỏ yêu cầu tham gia workspace đã gửi trước đó nếu yêu cầu đó chưa được xử lý.                                                          |
| **Tác nhân**        | User                                                                                                                                                           |
| **Điều kiện trước** | User đã gửi yêu cầu tham gia và yêu cầu đó đang ở trạng thái chờ.                                                                                              |
| **Điều kiện sau**   | Yêu cầu tham gia bị hủy bỏ khỏi danh sách chờ xử lý.                                                                                                           |
| **Luồng chính**     | Người dùng truy cập danh sách yêu cầu đã gửi. Người dùng chọn yêu cầu tham gia workspace cần hủy. Người dùng xác nhận hủy. Hệ thống xóa yêu cầu khỏi hệ thống. |
| **Luồng thay thế**  | Không có                                                                                                                                                       |
| **Luồng ngoại lệ**  | **E1: Yêu cầu đã được xử lý (Chấp nhận/Từ chối)** → Hệ thống thông báo lỗi, không cho phép hủy.                                                                |

14. ## **UC-14 Xử lý yêu cầu tham gia workspace**

| Use case ID         | UC-14                                                                                                                                                                                                                                        |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | **Xử lý yêu cầu tham gia workspace**                                                                                                                                                                                                         |
| **Mô tả**           | Cho phép Owner/Manager chấp nhận hoặc từ chối yêu cầu tham gia workspace từ người dùng khác.                                                                                                                                                 |
| **Tác nhân**        | User (Owner/Manager workspace)                                                                                                                                                                                                               |
| **Điều kiện trước** | Có yêu cầu tham gia workspace đang chờ xử lý. User có quyền quản lý thành viên trong workspace.                                                                                                                                              |
| **Điều kiện sau**   | Yêu cầu được chuyển trạng thái (Chấp nhận/Từ chối). User được thêm vào workspace nếu được chấp nhận.                                                                                                                                         |
| **Luồng chính**     | Owner/Manager truy cập danh sách yêu cầu tham gia. Chọn một yêu cầu. Chọn hành động (Chấp nhận/Từ chối). Nếu chấp nhận, hệ thống thêm user vào workspace với vai trò mặc định (Thành viên). Hệ thống gửi thông báo kết quả cho user yêu cầu. |
| **Luồng thay thế**  | **A1: Chấp nhận và gán vai trò tùy chỉnh** Tại bước 3, Manager chọn vai trò cụ thể trước khi chấp nhận. Hệ thống gán vai trò đó cho user mới.                                                                                                |
| **Luồng ngoại lệ**  | **E1: Người xử lý không có quyền** → Từ chối thao tác.                                                                                                                                                                                       |

15. ## **UC-15: Tạo project**

| Use case ID         | UC-15                                                                                                                                                                |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Tạo project                                                                                                                                                          |
| **Mô tả**           | Cho phép người dùng tạo project trong workspace                                                                                                                      |
| **Tác nhân**        | User                                                                                                                                                                 |
| **Điều kiện trước** | Người dùng đã đăng nhập Người dùng thuộc workspace                                                                                                                   |
| **Điều kiện sau**   | Project được tạo thành công Người tạo trở thành owner của project                                                                                                    |
| **Luồng chính**     | Người dùng truy cập trang workspace Người dùng nhấn nút tạo project Người dùng nhập thông tin Người dùng xác nhận tạo Hệ thống kiểm tra dữ liệu Hệ thống tạo project |
| **Luồng thay thế**  |                                                                                                                                                                      |
|                     |                                                                                                                                                                      |
| **Luồng ngoại lệ**  | **E1: Không thuộc workspace** → Không cho phép tạo **E2: Lỗi hệ thống khi lưu** → Thông báo thất bại                                                                 |

16. ## **UC-16: Cập nhật project**

| Use case ID         | UC-16                                                                                                                    |
| :------------------ | :----------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Cập nhật project                                                                                                         |
| **Mô tả**           | Cho phép chỉnh sửa thông tin project                                                                                     |
| **Tác nhân**        | User (Owner)                                                                                                             |
| **Điều kiện trước** | Có quyền chỉnh sửa project                                                                                               |
| **Điều kiện sau**   | Thông tin project được cập nhật                                                                                          |
| **Luồng chính**     | Người dùng mở project settings Người dùng chỉnh sửa thông tin Người dùng lưu Hệ thống kiểm tra dữ liệu Hệ thống cập nhật |
| **Luồng thay thế**  |                                                                                                                          |
|                     |                                                                                                                          |
| **Luồng ngoại lệ**  | **E1: Không có quyền** → Từ chối **E2: Dữ liệu không hợp lệ** → Không cập nhật                                           |

17. ## **UC-17: Xóa project**

| Use case ID         | UC-17                                                                                             |
| :------------------ | :------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Xóa project                                                                                       |
| **Mô tả**           | Cho phép xóa project và dữ liệu liên quan                                                         |
| **Tác nhân**        | User (Owner)                                                                                      |
| **Điều kiện trước** | Người dùng là owner                                                                               |
| **Điều kiện sau**   | Project bị xóa                                                                                    |
| **Luồng chính**     | Người dùng chọn delete project Hệ thống yêu cầu xác nhận Người dùng xác nhận Hệ thống xóa project |
| **Luồng thay thế**  |                                                                                                   |
|                     |                                                                                                   |
| **Luồng ngoại lệ**  | **E1: Không phải owner** → Không cho phép **E2: Lỗi khi xóa dữ liệu** → Thông báo lỗi             |

18. ## **UC-18: Xem danh sách project**

| Use case ID         | UC-18                                                                                         |
| :------------------ | :-------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Xem danh sách project                                                                         |
| **Mô tả**           | Hiển thị danh sách project trong workspace                                                    |
| **Tác nhân**        | User                                                                                          |
| **Điều kiện trước** | Người dùng thuộc workspace                                                                    |
| **Điều kiện sau**   | Danh sách project được hiển thị                                                               |
| **Luồng chính**     | Người dùng truy cập workspace Hệ thống lấy danh sách project Hệ thống hiển thị                |
| **Luồng thay thế**  | **A1: Lọc / tìm kiếm project** Người dùng nhập keyword / filter Hệ thống lọc Hiển thị kết quả |
|                     |                                                                                               |
| **Luồng ngoại lệ**  | **E1: Không có project** → Hiển thị empty state **E2: Lỗi khi load dữ liệu** → Thông báo lỗi  |

19. ## **UC-19: Thêm thành viên vào project**

| Use case ID         | UC-19                                                                                                                               |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Thêm thành viên vào project                                                                                                         |
| **Mô tả**           | Cho phép thêm thành viên từ workspace vào project                                                                                   |
| **Tác nhân**        | User (Owner / Manager)                                                                                                              |
| **Điều kiện trước** | Có quyền quản lý project User cần thêm đã thuộc workspace                                                                           |
| **Điều kiện sau**   | Thành viên được thêm vào project                                                                                                    |
| **Luồng chính**     | Người dùng chọn thêm member Chọn user từ danh sách workspace Chọn role (member, viewer,…) Xác nhận Hệ thống thêm vào project        |
| **Luồng thay thế**  | **A1: Thêm nhanh (default role)** Người dùng chọn user Hệ thống tự gán role mặc định Thêm vào project                               |
|                     |                                                                                                                                     |
| **Luồng ngoại lệ**  | **E1: User không thuộc workspace** → Không cho phép **E2: User đã trong project** → Không thêm lại **E3: Không có quyền** → Từ chối |

20. ## **UC-20: Xóa thành viên khỏi project**

| Use case ID         | UC-20                                                                                                                                                                           |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Xóa thành viên khỏi project                                                                                                                                                     |
| **Mô tả**           | Cho phép loại bỏ một thành viên khỏi project                                                                                                                                    |
| **Tác nhân**        | User                                                                                                                                                                            |
| **Điều kiện trước** | Người dùng có quyền quản lý project Thành viên tồn tại trong project                                                                                                            |
| **Điều kiện sau**   | Thành viên bị xóa khỏi project                                                                                                                                                  |
| **Luồng chính**     | Người dùng mở danh sách thành viên project Người dùng chọn thành viên Người dùng chọn remove Hệ thống yêu cầu xác nhận Người dùng xác nhận Hệ thống xóa thành viên khỏi project |
| **Luồng thay thế**  | Không có                                                                                                                                                                        |
|                     |                                                                                                                                                                                 |
| **Luồng ngoại lệ**  | **E1: Không có quyền** → Hệ thống từ chối **E2: Xóa owner** → Bị chặn hoặc yêu cầu transfer ownership                                                                           |

21. ## **UC-21 Rời project**

| Use case ID         | UC-21                                                                                                      |
| :------------------ | :--------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Rời project                                                                                                |
| **Mô tả**           | Cho phép thành viên tự rời khỏi project                                                                    |
| **Tác nhân**        | User (thuộc project)                                                                                       |
| **Điều kiện trước** | User đã đăng nhập và là thành viên của project                                                             |
| **Điều kiện sau**   | User bị xóa khỏi project                                                                                   |
| **Luồng chính**     | Người dùng chọn “Rời project” Hệ thống yêu cầu xác nhận Người dùng xác nhận Hệ thống xóa user khỏi project |
| **Luồng thay thế**  | Không có                                                                                                   |
| **Luồng ngoại lệ**  | **E1:** User là Owner **→** Bị chặn hoặc yêu cầu transfer ownership                                        |

22. ## **UC-22 Yêu cầu tham gia project**

| Use case ID         | UC-22                                                                                                                                                                      |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | **Yêu cầu tham gia project**                                                                                                                                               |
| **Mô tả**           | Cho phép thành viên trong workspace gửi yêu cầu tham gia một project mà họ chưa phải là thành viên.                                                                        |
| **Tác nhân**        | User (thuộc workspace)                                                                                                                                                     |
| **Điều kiện trước** | User đã đăng nhập và thuộc workspace chứa project. User chưa phải thành viên của project. Project có cấu hình cho phép yêu cầu tham gia.                                   |
| **Điều kiện sau**   | Yêu cầu tham gia được gửi đi và chờ Chủ project/Quản lý xử lý.                                                                                                             |
| **Luồng chính**     | Người dùng truy cập project (ở chế độ xem giới hạn). Người dùng chọn "Yêu cầu tham gia project". Hệ thống ghi nhận yêu cầu và gửi thông báo đến Owner/Manager của project. |
| **Luồng thay thế**  | Không có                                                                                                                                                                   |
| **Luồng ngoại lệ**  | **E1: User đã là thành viên của project** → Hệ thống thông báo lỗi.                                                                                                        |

23. ## **UC-23 Hủy yêu cầu tham gia project**

| Use case ID         | UC-23                                                                                                                                                        |
| :------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | **Hủy yêu cầu tham gia project**                                                                                                                             |
| **Mô tả**           | Cho phép người dùng hủy bỏ yêu cầu tham gia project đã gửi trước đó nếu yêu cầu đó chưa được xử lý.                                                          |
| **Tác nhân**        | User (thuộc workspace)                                                                                                                                       |
| **Điều kiện trước** | User đã gửi yêu cầu tham gia project và yêu cầu đó đang ở trạng thái chờ.                                                                                    |
| **Điều kiện sau**   | Yêu cầu tham gia project bị hủy bỏ.                                                                                                                          |
| **Luồng chính**     | Người dùng truy cập danh sách yêu cầu đã gửi. Người dùng chọn yêu cầu tham gia project cần hủy. Người dùng xác nhận hủy. Hệ thống xóa yêu cầu khỏi hệ thống. |
| **Luồng thay thế**  | Không có                                                                                                                                                     |
| **Luồng ngoại lệ**  | **E1: Yêu cầu đã được xử lý (Chấp nhận/Từ chối)** → Hệ thống thông báo lỗi, không cho phép hủy.                                                              |

24. ## **UC-24 Xử lý yêu cầu tham gia project**

| Use case ID         | UC-24                                                                                                                                                                                                                                    |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | **Xử lý yêu cầu tham gia project**                                                                                                                                                                                                       |
| **Mô tả**           | Cho phép Owner/Manager project chấp nhận hoặc từ chối yêu cầu tham gia project.                                                                                                                                                          |
| **Tác nhân**        | User (Owner/Manager project)                                                                                                                                                                                                             |
| **Điều kiện trước** | Có yêu cầu tham gia project đang chờ xử lý. User có quyền quản lý thành viên trong project.                                                                                                                                              |
| **Điều kiện sau**   | Yêu cầu được chuyển trạng thái. User được thêm vào project nếu được chấp nhận.                                                                                                                                                           |
| **Luồng chính**     | Owner/Manager truy cập danh sách yêu cầu tham gia project. Chọn một yêu cầu. Chọn hành động (Chấp nhận/Từ chối). Nếu chấp nhận, hệ thống thêm user vào project và gán vai trò mặc định. Hệ thống gửi thông báo kết quả cho user yêu cầu. |
| **Luồng thay thế**  | Không có                                                                                                                                                                                                                                 |
| **Luồng ngoại lệ**  | **E1: Người xử lý không có quyền** → Từ chối thao tác.                                                                                                                                                                                   |

25. ## **UC-25: Tạo task**

| Use case ID         | UC-25                                                                                                                                                                                                                                                                                                                                                                                               |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Tạo task                                                                                                                                                                                                                                                                                                                                                                                            |
| **Mô tả**           | Cho phép tạo task trong project                                                                                                                                                                                                                                                                                                                                                                     |
| **Tác nhân**        | User                                                                                                                                                                                                                                                                                                                                                                                                |
| **Điều kiện trước** | Người dùng thuộc project                                                                                                                                                                                                                                                                                                                                                                            |
| **Điều kiện sau**   | Task được tạo thành công                                                                                                                                                                                                                                                                                                                                                                            |
| **Luồng chính**     | Người dùng chọn tạo task Người dùng nhập thông tin (title, description,…) Người dùng xác nhận Hệ thống kiểm tra dữ liệu Hệ thống tạo task                                                                                                                                                                                                                                                           |
| **Luồng thay thế**  | **A1: Tạo nhanh (quick add)** Người dùng nhập title nhanh Hệ thống tạo task với default config **A2: Tạo task từ AI (natural language)** Người dùng nhập mô tả tự nhiên Người dùng gửi yêu cầu Hệ thống gửi dữ liệu tới AI service AI phân tích và trả về cấu trúc task (title, description, priority, deadline, …) Hệ thống hiển thị preview Người dùng xác nhận Hệ thống tạo task A3: Tạo subtask |
|                     |                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Luồng ngoại lệ**  | **E1: Không thuộc project** → Không cho tạo **E2: Dữ liệu không hợp lệ** → Từ chối                                                                                                                                                                                                                                                                                                                  |

26. ## **UC-26: Cập nhật task**

| Use case ID         | UC-26                                                                                          |
| :------------------ | :--------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Cập nhật task                                                                                  |
| **Mô tả**           | Cho phép chỉnh sửa thông tin task                                                              |
| **Tác nhân**        | User                                                                                           |
| **Điều kiện trước** | Có quyền chỉnh sửa task                                                                        |
| **Điều kiện sau**   | Task được cập nhật                                                                             |
| **Luồng chính**     | Người dùng mở task Người dùng chỉnh sửa Người dùng lưu Hệ thống validate Hệ thống cập nhật     |
| **Luồng thay thế**  | **A1: Inline edit (edit nhanh)** Người dùng chỉnh trực tiếp trên list/board Hệ thống auto-save |
|                     |                                                                                                |
| **Luồng ngoại lệ**  | **E1: Không có quyền** → Từ chối **E2: Dữ liệu không hợp lệ** → Không cập nhật                 |

27. ## **UC-27: Xóa task**

| Use case ID         | UC-27                                                                                       |
| :------------------ | :------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Xóa task                                                                                    |
| **Mô tả**           | Cho phép xóa task                                                                           |
| **Tác nhân**        | User                                                                                        |
| **Điều kiện trước** | Có quyền xóa task                                                                           |
| **Điều kiện sau**   | Task bị xóa                                                                                 |
| **Luồng chính**     | Người dùng chọn delete task Hệ thống yêu cầu xác nhận Người dùng xác nhận Hệ thống xóa task |
| **Luồng thay thế**  |                                                                                             |
|                     |                                                                                             |
| **Luồng ngoại lệ**  | **E1: Không có quyền** → Không cho phép **E2: Task không tồn tại** → Báo lỗi                |

28. ## **UC-28: Xem danh sách task**

| Use case ID         | UC-28                                                                                                                                                                                                       |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Xem danh sách task                                                                                                                                                                                          |
| **Mô tả**           | Hiển thị danh sách task trong project                                                                                                                                                                       |
| **Tác nhân**        | User                                                                                                                                                                                                        |
| **Điều kiện trước** | Người dùng thuộc project                                                                                                                                                                                    |
| **Điều kiện sau**   | Danh sách task được hiển thị                                                                                                                                                                                |
| **Luồng chính**     | Người dùng truy cập project Hệ thống lấy danh sách task Hệ thống hiển thị                                                                                                                                   |
| **Luồng thay thế**  | **A1: Lọc / tìm kiếm task** Người dùng nhập filter (status, assignee, priority) Hệ thống lọc Hiển thị **A2: Xem theo nhiều view (list / kanban / calendar)** Người dùng chọn view Hệ thống render tương ứng |
|                     |                                                                                                                                                                                                             |
| **Luồng ngoại lệ**  | **E1: Không có task** → Hiển thị empty state **E2: Lỗi load dữ liệu** → Thông báo lỗi                                                                                                                       |

29. ## **UC-29: Xem chi tiết task**

| Use case ID         | UC-29                                                                                                                            |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Xem chi tiết task                                                                                                                |
| **Mô tả**           | Cho phép người dùng xem đầy đủ thông tin của một task                                                                            |
| **Tác nhân**        | User                                                                                                                             |
| **Điều kiện trước** | Task tồn tại Người dùng có quyền truy cập                                                                                        |
| **Điều kiện sau**   | Thông tin task được hiển thị                                                                                                     |
| **Luồng chính**     | Người dùng chọn một task Hệ thống lấy dữ liệu chi tiết (description, assignee, deadline, priority, subtask, …) Hệ thống hiển thị |
| **Luồng thay thế**  | **A1: Xem nhanh (quick preview)** Người dùng hover / click nhanh Hệ thống hiển thị popup                                         |
|                     |                                                                                                                                  |
| **Luồng ngoại lệ**  | **E1: Task không tồn tại** → Thông báo lỗi **E2: Không có quyền truy cập** → Từ chối                                             |

30. ## **UC-30: Bình luận vào task**

| Use case ID         | UC-30                                                                                                                                                                                           |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Bình luận task                                                                                                                                                                                  |
| **Mô tả**           | Cho phép người dùng trao đổi, thảo luận trong task                                                                                                                                              |
| **Tác nhân**        | User                                                                                                                                                                                            |
| **Điều kiện trước** | Task tồn tại                                                                                                                                                                                    |
| **Điều kiện sau**   | Comment được tạo                                                                                                                                                                                |
| **Luồng chính**     | Người dùng mở task Người dùng nhập comment Người dùng gửi Hệ thống lưu comment                                                                                                                  |
| **Luồng thay thế**  | **A1: Mention user (@user)** Người dùng mention Hệ thống notify user **A2: Reply user** Người dùng nhấn nút reply một comment Người dùng nhập comment reply Người dùng gửi Hệ thống lưu comment |
|                     |                                                                                                                                                                                                 |
| **Luồng ngoại lệ**  | **E1: Nội dung rỗng** → Không cho gửi **E2: Không có quyền truy cập task** → Từ chối                                                                                                            |

31. ## **UC-31: Đính kèm file vào task**

| Use case ID         | UC-31                                                                                                |
| :------------------ | :--------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Đính kèm file                                                                                        |
| **Mô tả**           | Cho phép upload và gắn file vào task                                                                 |
| **Tác nhân**        | User                                                                                                 |
| **Điều kiện trước** | Task tồn tại                                                                                         |
| **Điều kiện sau**   | File được lưu và liên kết với task                                                                   |
| **Luồng chính**     | Người dùng chọn upload file Người dùng chọn file Hệ thống upload Hệ thống lưu metadata Hiển thị file |
| **Luồng thay thế**  | **A1: Drag & drop file** Người dùng kéo file vào UI Hệ thống upload                                  |
|                     |                                                                                                      |
| **Luồng ngoại lệ**  | **E1: File quá lớn / format không hợp lệ** → Từ chối **E2: Lỗi upload** → Thông báo                  |

32. ## **UC-32: Gợi ý task nên thực hiện tiếp tđheo**

| Use case ID         | UC-32                                                                                                          |
| :------------------ | :------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Gợi ý task tiếp theo                                                                                           |
| **Mô tả**           | Hệ thống AI đề xuất task ưu tiên nên làm tiếp theo dựa trên trạng thái project, deadline, dependency.          |
| **Tác nhân**        | User                                                                                                           |
| **Điều kiện trước** | User có project và danh sách task                                                                              |
| **Điều kiện sau**   | Danh sách gợi ý được hiển thị                                                                                  |
| **Luồng chính**     | User mở project Hệ thống hiển thị gợi ý task tiếp theo có kèm giải thích tại giao diện trang tổng quan project |
| **Luồng thay thế**  | Không đủ dữ liệu → gợi ý đơn giản (deadline gần nhất)                                                          |
|                     |                                                                                                                |
| **Luồng ngoại lệ**  | AI service lỗi → fallback rule-based                                                                           |

33. ## **UC-33: Cảnh báo overload**

| Use case ID         | UC-33                                                                                                                                                |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Cảnh báo quá tải công việc                                                                                                                           |
| **Mô tả**           | Hệ thống phát hiện khi user có workload vượt ngưỡng và đưa ra cảnh báo.                                                                              |
| **Tác nhân**        | User                                                                                                                                                 |
| **Điều kiện trước** | User có nhiều task đang active Có estimate hoặc deadline                                                                                             |
| **Điều kiện sau**   | User nhận được cảnh báo overload                                                                                                                     |
| **Luồng chính**     | Hệ thống định kỳ kiểm tra workload Tính tổng effort / thời gian So sánh với ngưỡng cấu hình Nếu vượt ngưỡng → tạo cảnh báo Hiển thị cảnh báo trên UI |
| **Luồng thay thế**  | Không có estimate → dùng số lượng task thay thế                                                                                                      |
|                     |                                                                                                                                                      |
| **Luồng ngoại lệ**  | E1. Không đủ dữ liệu → không cảnh báo                                                                                                                |

34. ## **UC-34 Tạo báo cáo tiến độ**

| Use case ID         | UC-34                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Tạo báo cáo tiến độ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Mô tả**           | Hệ thống sử dụng AI để phân tích dữ liệu project và sinh ra: Tóm tắt tiến độ (summary) Phân tích hiệu suất Phát hiện vấn đề (risk, bottleneck) Đề xuất cải thiện                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Tác nhân**        | User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Điều kiện trước** | User đã đăng nhập Project có: Task Status history hoặc activity log                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Điều kiện sau**   | Insight được hiển thị cho user Có thể export                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Luồng chính**     | User truy cập trang project dashboard User chọn “Generate Report” Hệ thống thu thập dữ liệu: Task list (status, priority, assignee) Deadline Completion history Activity log Hệ thống tiền xử lý: Loại bỏ dữ liệu nhiễu Chuẩn hóa format Tính toán metric: Completion rate Avg completion time Overdue ratio Gửi dữ liệu sang AI Engine AI thực hiện: Tóm tắt tiến độ Phân tích xu hướng Phát hiện vấn đề: Task bị delay nhiều Bottleneck theo assignee Sinh đề xuất: Re-prioritize Reassign task Hệ thống nhận kết quả và format lại: Summary section Insight section Recommendation section Hiển thị cho user User có thể: Export (PDF / text) Copy nội dung Regenerate |
| **Luồng thay thế**  | **A1. Dữ liệu không đủ mạnh** Summary đơn giản Không có recommendation **A2. User chọn quick mode** Bỏ qua phân tích sâu Chỉ trả về summary \+ basic stats                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Luồng ngoại lệ**  | **E1. AI service timeout / lỗi** Fallback: Hiển thị thống kê: Completion rate Task done / total Thông báo: “AI insight currently unavailable” **E2. Dữ liệu không hợp lệ** Không generate report Hiển thị lỗi validation                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

35. ## **UC-35: Tạo workflow từ project**

| Use case ID         | UC-35                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Tạo workflow từ project                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Mô tả**           | Cho phép người dùng chuyển một project hiện có thành workflow. Hệ thống tự động phân tích cấu trúc project (sprint, task), sinh các bước thực hiện (workflow steps) bằng rule-based, sau đó sử dụng AI để tinh chỉnh tên và mô tả các bước nhằm tăng tính dễ hiểu. Người dùng có thể chỉnh sửa trước khi publish.                                                                                                                                                                                                     |
| **Tác nhân**        | User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Điều kiện trước** | Người dùng đã đăng nhập vào hệ thống Người dùng có quyền truy cập project Project tồn tại và có ít nhất 1 task hoặc sprint                                                                                                                                                                                                                                                                                                                                                                                            |
| **Điều kiện sau**   | Workflow được tạo ở trạng thái Draft Workflow bao gồm danh sách step, mapping với task/sprint và có thể chỉnh sửa                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Luồng chính**     | Người dùng chọn project cần chia sẻ Người dùng chọn chức năng “Share as Workflow” Hệ thống thu thập dữ liệu từ project (sprint, task, subtask) Hệ thống sinh workflow step bằng rule-based: Nếu có sprint → mỗi sprint là một step Nếu không có sprint → nhóm task theo keyword hoặc trạng thái Hệ thống gửi danh sách step sang AI để tinh chỉnh tên và mô tả Hệ thống nhận kết quả từ AI và tổng hợp workflow hoàn chỉnh Hệ thống hiển thị preview workflow cho người dùng Hệ thống lưu workflow ở trạng thái Draft |
| **Luồng thay thế**  | A1: Không có sprint Hệ thống nhóm task theo keyword hoặc trạng thái để tạo step A2: Người dùng không sử dụng AI refinement Hệ thống giữ nguyên step từ rule-based                                                                                                                                                                                                                                                                                                                                                     |
|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Luồng ngoại lệ**  | E1: AI service không khả dụng Hệ thống fallback sang rule-based Workflow vẫn được tạo nhưng không có mô tả nâng cao E2: Dữ liệu project không hợp lệ (task rỗng hoặc không đủ thông tin) Hệ thống thông báo lỗi và không tạo workflow                                                                                                                                                                                                                                                                                 |

36. ## **UC-36: Chỉnh sửa workflow**

| Use case ID         | UC-36                                                                    |
| :------------------ | :----------------------------------------------------------------------- |
| **Tên chức năng**   | Chỉnh sửa workflow                                                       |
| **Mô tả**           | Cho phép chỉnh sửa nội dung workflow                                     |
| **Tác nhân**        | User                                                                     |
| **Điều kiện trước** | Workflow ở trạng thái draft                                              |
| **Điều kiện sau**   | Workflow được cập nhật                                                   |
| **Luồng chính**     | Người dùng mở workflow Chỉnh sửa nội dung workflow Lưu Hệ thống cập nhật |
| **Luồng thay thế**  | **A1: Reorder step** → Drag & drop **A2: Thêm / xóa step** → Cập nhật    |
|                     |                                                                          |
| **Luồng ngoại lệ**  | **E1: Không có quyền** → Từ chối                                         |

37. ## **UC-37: Chia sẻ workflow**

| Use case ID         | UC-37                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Chia sẻ workflow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Mô tả**           | User đưa workflow lên community để chia sẻ.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Tác nhân**        | User                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Điều kiện trước** | Workflow hợp lệ Đã điền đủ metadata                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Điều kiện sau**   | Workflow public Có thể được người khác tìm thấy                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Luồng chính**     | User mở workflow ở trạng thái draft User nhấn “Publish” Hệ thống kiểm tra quyền hạn user: Có phải owner không Workflow có bị lock không Hệ thống validate dữ liệu: Name không rỗng Description đạt độ dài tối thiểu Có ít nhất 1 task Task không bị orphan (dependency hợp lệ) Hệ thống chuẩn hóa dữ liệu: Trim text Chuẩn hóa format task Sinh metadata: createdAt version slug (cho URL) Hệ thống thực hiện publish: Update trạng thái Public cho workflow Lưu vào database Hệ thống trả response thành công Hệ thống thông báo publish thành công và redirect sang trang workflow detail |
| **Luồng thay thế**  | **A1. User chỉnh sửa trước khi publish** Tại bước 2: User chọn “Edit” thay vì publish Quay lại UC-35 **A2. Workflow đã từng publish (republish/update)** Tại bước 3, nếu workflow đã publish trước đó: Không tạo mới Tăng version Update nội dung Sau đó tiếp tục từ bước 5 **A3. Soft validation warning** Tại bước 4, nếu description quá ngắn / thiếu tag: Không block Hiển thị warning: “Workflow có thể khó được tìm thấy” User vẫn có thể tiếp tục publish                                                                                                                            |
|                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Luồng ngoại lệư** | E1. Không đủ quyền Tại bước 3, nếu user không phải owner → Trả lỗi: 403 Forbiden → Không tiếp tục E2. Validation fail Tại bước 4: Thiếu name / task invalid → Trả lỗi: Hiển thị field bị lỗi → Không publish E3. Lỗi database khi lưu Tại bước 6: DB lỗi / transaction fail → Rollback toàn bộ → Trả lỗi “Publish thất bại, thử lại sau”                                                                                                                                                                                                                                                    |

38. ## **UC-38: Khám phá workflow**

| Use case ID         | UC-38                                                                                                                                                               |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | Khám phá workflow                                                                                                                                                   |
| **Mô tả**           | Cho phép người dùng tìm kiếm và sử dụng workflow từ người khác                                                                                                      |
| **Tác nhân**        | User                                                                                                                                                                |
| **Điều kiện trước** |                                                                                                                                                                     |
| **Điều kiện sau**   |                                                                                                                                                                     |
| **Luồng chính**     | Người dùng mở trang khám phá Hệ thống hiển thị danh sách workflow public Người dùng tìm kiếm / filter Người dùng chọn workflow Người dùng apply                     |
| **Luồng thay thế**  | **A1: AI gợi ý workflow phù hợp** Hệ thống phân tích hành vi user Gợi ý workflow **A2: Xem preview trước khi dùng** Người dùng mở preview Xem step Quyết định apply |
|                     |                                                                                                                                                                     |
| **Luồng ngoại lệ**  | **E1: Không có workflow phù hợp** → Hiển thị rỗng                                                                                                                   |

39. ## **UC-39 Xem chi tiết workflow**

| Use case ID         | UC-39                                                                                                                                                                                                               |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | **Xem chi tiết workflow**                                                                                                                                                                                           |
| **Mô tả**           | Cho phép người dùng xem cấu trúc, mô tả và các bước (steps) chi tiết của một workflow đã được chia sẻ (public) hoặc là bản nháp của họ.                                                                             |
| **Tác nhân**        | User                                                                                                                                                                                                                |
| **Điều kiện trước** | Workflow tồn tại. Người dùng có quyền truy cập (public hoặc là owner/draft).                                                                                                                                        |
| **Điều kiện sau**   | Thông tin chi tiết của workflow được hiển thị.                                                                                                                                                                      |
| **Luồng chính**     | Người dùng truy cập trang Khám phá (Explore) hoặc danh sách workflow đã đăng. Người dùng chọn một workflow. Hệ thống lấy dữ liệu chi tiết (steps, mô tả, đánh giá, bình luận). Hệ thống hiển thị chi tiết workflow. |
| **Luồng thay thế**  | **A1: Xem thông tin tác giả** Người dùng click vào tên tác giả. Hệ thống hiển thị hồ sơ cơ bản của tác giả.                                                                                                         |
| **Luồng ngoại lệ**  | **E1: Workflow không tồn tại hoặc không có quyền truy cập** → Thông báo lỗi 404 hoặc từ chối truy cập.                                                                                                              |

40. ## **UC-40 Đánh giá workflow**

| Use case ID         | UC-40                                                                                                                                                                             |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | **Đánh giá workflow**                                                                                                                                                             |
| **Mô tả**           | Cho phép người dùng đánh giá (rating) chất lượng của workflow đã được chia sẻ.                                                                                                    |
| **Tác nhân**        | User                                                                                                                                                                              |
| **Điều kiện trước** | Workflow tồn tại và ở trạng thái public. User đã đăng nhập.                                                                                                                       |
| **Điều kiện sau**   | Đánh giá của người dùng được ghi nhận và cập nhật điểm trung bình của workflow.                                                                                                   |
| **Luồng chính**     | Người dùng xem chi tiết workflow. Người dùng chọn số sao đánh giá (1-5) và/hoặc nhập nhận xét ngắn. Hệ thống lưu rating của user. Hệ thống cập nhật điểm trung bình cho workflow. |
| **Luồng thay thế**  | **A1: Thay đổi đánh giá** Người dùng đã đánh giá, chọn lại số sao/sửa nhận xét. Hệ thống cập nhật rating mới.                                                                     |
| **Luồng ngoại lệ**  | **E1: Lỗi hệ thống khi lưu** → Thông báo thất bại.                                                                                                                                |

41. ## **UC-41 Bình luận workflow**

| Use case ID         | UC-41                                                                                                                                                             |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | **Bình luận workflow**                                                                                                                                            |
| **Mô tả**           | Cho phép người dùng trao đổi, bình luận về nội dung của workflow đã được chia sẻ.                                                                                 |
| **Tác nhân**        | User                                                                                                                                                              |
| **Điều kiện trước** | Workflow tồn tại và ở trạng thái public. User đã đăng nhập.                                                                                                       |
| **Điều kiện sau**   | Bình luận được lưu và hiển thị trong danh sách bình luận của workflow.                                                                                            |
| **Luồng chính**     | Người dùng xem chi tiết workflow. Người dùng nhập nội dung bình luận. Người dùng gửi. Hệ thống kiểm tra nội dung và lưu comment. Hệ thống hiển thị bình luận mới. |
| **Luồng thay thế**  | **A1: Trả lời bình luận (Reply)** Người dùng chọn reply một comment. Hệ thống lưu comment dưới dạng comment con.                                                  |
| **Luồng ngoại lệ**  | **E1: Nội dung bình luận không hợp lệ (trống/spam)** → Từ chối đăng và thông báo lỗi.                                                                             |

42. ## **UC-42 Lưu workflow yêu thích**

| Use case ID         | UC-42                                                                                                                                                                     |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên chức năng**   | **Lưu workflow yêu thích**                                                                                                                                                |
| **Mô tả**           | Cho phép người dùng đánh dấu và lưu trữ các workflow đã được chia sẻ (public) để tiện theo dõi/sử dụng sau này.                                                           |
| **Tác nhân**        | User                                                                                                                                                                      |
| **Điều kiện trước** | Workflow tồn tại và ở trạng thái public. User đã đăng nhập.                                                                                                               |
| **Điều kiện sau**   | Workflow được thêm/bỏ khỏi danh sách yêu thích của người dùng.                                                                                                            |
| **Luồng chính**     | Người dùng xem danh sách/chi tiết workflow. Người dùng chọn biểu tượng "Lưu yêu thích" (Favorite). Hệ thống lưu liên kết workflow vào danh sách yêu thích của người dùng. |
| **Luồng thay thế**  | **A1: Bỏ yêu thích** Người dùng chọn lại biểu tượng "Lưu yêu thích". Hệ thống xóa workflow khỏi danh sách yêu thích.                                                      |
| **Luồng ngoại lệ**  | **E1: Lỗi hệ thống khi lưu** → Thông báo thất bại.                                                                                                                        |

43. ## **UC-43: Tạo project từ workflow**

| Use case ID         | UC-43                                                                                                                                                                |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Tạo project từ workflow                                                                                                                                              |
| **Mô tả**           | Cho phép tạo project từ workflow đã có                                                                                                                               |
| **Tác nhân**        | User                                                                                                                                                                 |
| **Điều kiện trước** |                                                                                                                                                                      |
| **Điều kiện sau**   |                                                                                                                                                                      |
| **Luồng chính**     | Người dùng chọn workflow Người dùng chọn “Apply” Hệ thống tạo project hoặc task structure Hệ thống hiển thị kết quả                                                  |
| **Luồng thay thế**  | **A1: Áp dụng một phần workflow** Người dùng chọn step Hệ thống chỉ tạo phần đó **A2: Tùy chỉnh trước khi apply** Hệ thống hiển thị preview Người dùng chỉnh sửa Tạo |
|                     |                                                                                                                                                                      |
| **Luồng ngoại lệ**  |                                                                                                                                                                      |

44. ## **UC-44 Xem workflow đã đăng**

| Use case ID         | UC-44                                                                                                                                                                                          |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | **Xem workflow đã đăng**                                                                                                                                                                       |
| **Mô tả**           | Cho phép người dùng xem danh sách các workflow mà họ đã tạo và chia sẻ (public) hoặc đang ở trạng thái nháp (draft).                                                                           |
| **Tác nhân**        | User                                                                                                                                                                                           |
| **Điều kiện trước** | User đã đăng nhập.                                                                                                                                                                             |
| **Điều kiện sau**   | Danh sách workflow do user tạo được hiển thị (bao gồm cả Draft và Public).                                                                                                                     |
| **Luồng chính**     | Người dùng truy cập trang quản lý workflow cá nhân. Hệ thống truy vấn danh sách workflow do user này là tác giả. Hệ thống hiển thị danh sách, bao gồm tên, mô tả và trạng thái (Draft/Public). |
| **Luồng thay thế**  | **A1: Lọc theo trạng thái** 1\. Người dùng chọn filter (Draft / Public). 2\. Hệ thống cập nhật danh sách hiển thị.                                                                             |
| **Luồng ngoại lệ**  | **E1: Không có workflow nào được đăng** → Hiển thị trạng thái empty và gợi ý tạo mới.                                                                                                          |

45. ## **UC-45: Xem dashboard project**

| Use case ID         | UC-45                                                                                                                                                                                    |
| :------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Xem dashboard project                                                                                                                                                                    |
| **Mô tả**           | Hiển thị tổng quan về tiến độ công việc, project và hiệu suất                                                                                                                            |
| **Tác nhân**        | User                                                                                                                                                                                     |
| **Điều kiện trước** | Người dùng có dữ liệu task/project                                                                                                                                                       |
| **Điều kiện sau**   | Dashboard được hiển thị                                                                                                                                                                  |
| **Luồng chính**     | Người dùng mở dashboard Hệ thống tổng hợp dữ liệu (task, deadline, progress…) Hệ thống hiển thị biểu đồ / thống kê                                                                       |
| **Luồng thay thế**  | **A1: Filter theo project / thời gian** Người dùng chọn filter Hệ thống cập nhật dữ liệu hiển thị **A2: Tùy chỉnh widget dashboard** Người dùng chọn widget muốn xem Hệ thống lưu config |
|                     |                                                                                                                                                                                          |
| **Luồng ngoại lệ**  | **E1: Không có dữ liệu** → Hiển thị trạng thái rỗng                                                                                                                                      |

46. ## **UC-46: Xem dashboard cá nhân**

| Use case ID         | UC-46                                                                                                           |
| :------------------ | :-------------------------------------------------------------------------------------------------------------- |
| **Tên chức năng**   | Xem dashboard cá nhân                                                                                           |
| **Mô tả**           | Đánh giá hiệu suất làm việc dựa trên dữ liệu task                                                               |
| **Tác nhân**        | User                                                                                                            |
| **Điều kiện trước** |                                                                                                                 |
| **Điều kiện sau**   |                                                                                                                 |
| **Luồng chính**     | Người dùng mở analytics Hệ thống tính toán: Task hoàn thành Thời gian trung bình Deadline miss Hiển thị kết quả |
| **Luồng thay thế**  | **A1: AI phân tích nâng cao** Hệ thống gửi dữ liệu cho AI AI đưa ra nhận xét Hiển thị insight                   |
|                     |                                                                                                                 |
| **Luồng ngoại lệ**  | **A1: AI phân tích nâng cao** Hệ thống gửi dữ liệu cho AI AI đưa ra nhận xét Hiển thị insight                   |

##

##
