Hiện tại, phần tạo workflow đang có vấn đề về các step:

- Hệ thống lấy luôn cả trạng thái của task để đưa vào trạng thái của step khiến trạng thái step bị sai lệch
- Về định nghĩa: trạng thái của step khi vừa tạo workflow luôn là todo, khi người dùng clone về và bắt đầu thực hiện bất kỳ bước gì thì mới tick vào là IN_PROGRESS
- Ngoài trạng thái, thì step cũng phải cung cấp khả năng thực thi step nhanh chóng cho người dùng (vấn đề tạo workflow)
