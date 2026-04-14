# User Flows & Use Cases (Synced with UC-01 .. UC-46 from Documents.md)

Tài liệu mô tả các luồng người dùng dự trên bộ 46 Use Cases mới nhất do có thay đổi về quy hoạch tính năng.

## 1. Actors

| Actor           | Mô tả                  | Quyền chính                                              |
| :-------------- | :--------------------- | :------------------------------------------------------- |
| Guest           | Người chưa đăng nhập   | Đăng ký, đăng nhập                                       |
| User            | Người dùng đã xác thực | Cập nhật hồ sơ, quản lý workspace/project, thực thi task |
| Workspace Owner | Chủ workspace          | Quản lý không gian làm việc và nhân sự cấp cao           |
| Project Manager | Điều hành project      | Quản lý tiến độ, báo cáo, phân bổ nhân lực               |
| Project Member  | Thành viên thực thi    | Làm task, comment, upload file                           |
| Contributor     | Người đóng góp nổi bật | Tạo và chia sẻ workflow chuẩn cộng đồng                  |
| AI Engine       | Tác nhân AI            | Đề xuất task, theo dõi rủi ro overload                   |

---

## 2. Core User Flows

### 2.1 Account Access Flow

```mermaid
sequenceDiagram
    participant G as Guest
    participant S as System
    participant U as User

    G->>S: Đăng ký tài khoản (UC-01)
    S-->>G: Giao diện đăng nhập
    G->>S: Đăng nhập (UC-02)
    S-->>U: Cấp phiên làm việc (Token)
    U->>S: Đăng xuất (UC-03) / Cập nhật Profile (UC-04)
```

**Mapped UC**: UC-01, UC-02, UC-03, UC-04

### 2.2 Workspace Membership Flow

```mermaid
flowchart TD
    A[Tạo workspace] --> B[Cập nhật/Xóa]
    B --> C[Mời/Xóa thành viên]
    C --> D[Người dùng Request tham gia]
    D --> E[Owner xử lý Request UC-14]
```

**Mapped UC**: UC-05 đến UC-14

### 2.3 Project Membership Flow

```mermaid
flowchart TD
    A[Tạo project từ workspace] --> B[Cập nhật/Xóa Project]
    B --> C[Quản lý thành viên/Request duyệt]
    C --> D[Member tự rời/ Bị xóa]
```

**Mapped UC**: UC-15 đến UC-24

### 2.4 Task & Collaboration Flow

```mermaid
sequenceDiagram
    participant M as Member
    participant S as System

    M->>S: Tạo task (UC-25) & Xem danh sách (UC-28)
    M->>S: Xem chi tiết task (UC-29)
    M->>S: Cập nhật task trạng thái, ngày hẹn (UC-26)
    M->>S: Comment & Upload File (UC-30, UC-31)
    S-->>M: Cập nhật giao diện
```

**Mapped UC**: UC-25 đến UC-31 (Đã merge Flow comment và tag)

### 2.5 AI & Reporting

```mermaid
flowchart LR
    A[Dữ liệu Task & User] --> B[AI / System Analytics]
    B --> C[Gợi ý Next Task UC-32]
    B --> D[Cảnh báo Overload UC-33]
    B --> E[Xuất Report UC-34]
```

**Mapped UC**: UC-32, UC-33, UC-34

### 2.6 Workflow Knowledge Sharing Flow (Vốn tri thức)

```mermaid
flowchart TD
    A["Chuyên gia tạo workflow<br>từ Project (UC-35)"] --> B["Chỉnh sửa & Chia sẻ công khai (UC-36, 37)"]
    B --> C["Sinh viên khám phá (UC-38)"]
    C --> D["Xem chi tiết, Đánh giá, Comment"]
    D --> E["Lưu Yêu Thích (UC-42)"]
    E --> F["Tạo Project mới<br>từ Workflow mẫu (UC-43)"]
```

**Mapped UC**: UC-35 đến UC-44

### 2.7 Dashboard

```mermaid
flowchart LR
    A["Mở Dashboard Project"] --> B["Xem tổng quan<br>tiến độ chung (UC-45)"]
    C["Mở Dashboard Cá nhân"] --> D["Xem tiến độ<br>riêng mình (UC-46)"]
```

**Mapped UC**: UC-45, UC-46

---

## 3. Use Case Index (Full 46)

- UC-01 .. UC-04: Account & Profile
- UC-05 .. UC-14: Workspace Management
- UC-15 .. UC-24: Project Management
- UC-25 .. UC-31: Task & Collaboration
- UC-32 .. UC-33: AI Business Support
- UC-34: Reporting
- UC-35 .. UC-44: Workflow Knowledge Sharing (Template)
- UC-45 .. UC-46: Dashboards
