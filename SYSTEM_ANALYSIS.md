# TN Clinic Management Backend - Phân Tích Hệ Thống Toàn Diện

## 📌 Tổng Quan Hệ Thống

**TN Clinic Management Backend** là một hệ thống quản lý phòng khám tích hợp AI được xây dựng bằng **NestJS**, **PostgreSQL**, **TypeORM** và tích hợp **Cloudinary** cho quản lý ảnh.

### Mục Đích Chính
- Quản lý bệnh nhân và hồ sơ khám chữa bệnh
- Quản lý antàn nhân viên (Bác sĩ, Nhân viên tiếp đón, v.v.)
- Quản lý xếp hàng chờ khám và trang phục các cuộc khám
- Quản lý dịch vụ y tế (dịch vụ khám, xét nghiệm, chẩn đoán hình ảnh,...)
- Quản lý kết quả các dịch vụ cóc kiểu ảnh
- Tích hợp AI để phát hiện, chú thích (annotation) trên ảnh y tế
- Quản lý hệ thống và quyền truy cập

---

## 🏗️ Kiến Trúc Hệ Thống

### Cấu Trúc Module Chính

```
TN Clinic Management BE
├── IAM Module (Identity & Access Management)
│   ├── Auth Module (Xác thực người dùng)
│   ├── Staff Module (Quản lý nhân viên)
│   ├── Patients Module (Quản lý bệnh nhân)
│   └── Roles Module (Quản lý vai trò)
│
├── Clinical Module (Quản lý lâm sàng)
│   ├── Encounters Module (Cuộc khám - Lịch sử khám)
│   └── ICD10 Module (Chuẩn đoán y tế)
│
├── Paraclinical Module (Dịch vụ hỗ trợ)
│   ├── Services (Danh sách dịch vụ)
│   ├── Service Orders (Đơn đặt dịch vụ)
│   └── Results (Kết quả dịch vụ & Ảnh kết quả)
│
├── Reception Module (Tiếp đón)
│   └── Queue Module (Xếp hàng chờ)
│
├── AI Core Module (Tích hợp AI)
│   ├── AI Detection (Phát hiện trên ảnh)
│   ├── Annotation (Chú thích ảnh)
│   └── Projects (Dự án AI)
│
└── System Module (Hệ thống)
    └── Org Rooms (Quản lý phòng)
```

### Công Nghệ Stack
- **Framework**: NestJS v11
- **Database**: PostgreSQL (TypeORM v0.3.28)
- **Authentication**: JWT + Passport
- **Password Hashing**: Argon2
- **File Upload**: Cloudinary
- **HTTP Client**: Axios
- **WebSocket**: Socket.io (Real-time Queue)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator, class-transformer

---

## 💾 Data Model (Entity Relationships)

### 1. **Authentication & Authorization Layer**

#### `sys_users` (Hệ thống Người Dùng)
```
┌─────────────────────────────────┐
│      sys_users (Người dùng)     │
├─────────────────────────────────┤
│ user_id (UUID, Primary)         │
│ username (Unique)               │
│ password (Hashed, Select=false) │
│ email                           │
│ phone                           │
│ cccd (ID card, Unique)          │
│ is_active (boolean)             │
│ refresh_token_hash              │
│ created_at, deleted_at          │
└─────────────────────────────────┘
         │
    ┌────┴─────────────┬──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────┐
│ staff_profiles
│ │  patient_   │  │   (Bác sĩ,   │
│ profiles    │  │    Tiếp đón,  │  │ (Bệnh nhân) │
│ (Nhân viên) │  │     Admin)   │  │             │
└──────────────┘  └──────────────┘  └─────────────┘
```

#### `staff_profiles` (Hồ Sơ Nhân Viên)
```
- staff_id (PK)
- user_id (FK)
- full_name, phone, cccd
- specialty (Chuyên khoa)
- license_number (Số chứng chỉ)
- role (FK) -> sys_roles
- assigned_room_id (FK) -> org_rooms
- is_active, created_at, deleted_at
```

#### `patient_profiles` (Hồ Sơ Bệnh Nhân)
```
- patient_id (PK)
- user_id (FK)
- full_name, phone, cccd
- date_of_birth
- gender
- address
- created_by (FK -> staff_profiles)
- created_at, deleted_at
```

#### `sys_roles` (Vai Trò & Quyền)
```
- role_id (PK)
- role_code (ADMIN, DOCTOR, RECEPTIONIST, etc.)
- role_name
- is_active
```

#### `org_rooms` (Phòng Khám)
```
- room_id (PK)
- room_name
- room_type (CASHIER, CONSULTATION, SERVICE)
- is_active
- description
```

---

### 2. **Clinical Management Layer**

#### `medical_encounters` (Cuộc Khám Chữa Bệnh)
```
┌──────────────────────────────────┐
│    medical_encounters            │
│  (Lịch sử khám chữa bệnh)         │
├──────────────────────────────────┤
│ encounter_id (UUID, PK)          │
│ patient_id (FK)                  │
│ doctor_id (FK)                   │
│ assigned_room_id (FK)            │
│ final_icd_code (FK)              │
│ visit_date                       │
│ current_status (ENUM)            │
│                                  │
│ VITAL SIGNS (Chỉ số sinh hiệu):  │
│ - weight, height, bmi            │
│ - temperature                    │
│ - pulse (Nhịp tim)               │
│ - respiratory_rate (Nhịp thở)    │
│ - bp_systolic, bp_diastolic      │
│ - sp_o2 (Độ bão hòa oxy)         │
│                                  │
│ initial_symptoms (Triệu chứng)   │
│ doctor_conclusion (Kết luận)     │
│ deleted_at                       │
└──────────────────────────────────┘
```

**Encounter Status Flow**:
```
REGISTERED 
  ↓
AWAITING_PAYMENT 
  ↓
IN_CONSULTATION (Đang khám)
  ↓
AWAITING_CLS (Chờ xét nghiệm/chẩn đoán hình ảnh)
  ↓
IN_CLS (Đang thực hiện dịch vụ)
  ↓
CLS_COMPLETED (Xong dịch vụ)
  ↓
RESULTS_READY (Kết quả sẵn sàng)
  ↓
COMPLETED (Hoàn tất)
```

#### `ref_icd10` (Chẩn Đoán Y Tế)
```
- icd_code (Mã ICD10, PK)
- icd_name (Tên chẩn đoán)
- category
- is_active
```

---

### 3. **Reception & Queue Management Layer**

#### `queue_tickets` (Phiếu Xếp Hàng)
```
┌──────────────────────────────────┐
│    queue_tickets                 │
│  (Phiếu xếp hàng chờ)            │
├──────────────────────────────────┤
│ ticket_id (UUID, PK)             │
│ encounter_id (FK, nullable)      │
│ room_id (FK)                     │
│ ticket_type (ENUM):              │
│   - REGISTRATION (Đăng ký)       │
│   - CONSULTATION (Khám)          │
│   - SERVICE (Dịch vụ)            │
│ display_number (Số hiển thị)     │
│ source (ONLINE/WALKIN)           │
│ status (ENUM):                   │
│   - WAITING (Chờ)                │
│   - CALLED (Gọi)                 │
│   - IN_PROGRESS (Đang xử lý)     │
│   - COMPLETED (Hoàn tất)         │
│   - SKIPPED (Bỏ qua)             │
│ created_at, called_at            │
│ started_at, completed_at         │
│ service_ids (Danh sách dịch vụ)  │
└──────────────────────────────────┘
```

#### `queue_counters` (Bộ Đếm Phiếu)
```
- counter_id (PK)
- room_id (FK)
- ticket_type (ENUM)
- last_number (Số cuối cùng)
- reset_date (Ngày reset - mỗi ngày)
```

---

### 4. **Paraclinical Services Layer**

#### `ref_services` (Danh Sách Dịch Vụ)
```
┌─────────────────────────────────┐
│   ref_services                  │
│ (Danh sách dịch vụ Y tế)         │
├─────────────────────────────────┤
│ service_id (int, PK)            │
│ service_name                    │
│ category_id (FK)                │
│ description                     │
│ unit_price (Giá dịch vụ)        │
│ is_active                       │
│ created_at, deleted_at          │
└─────────────────────────────────┘
```

#### `ref_service_categories` (Danh Mục Dịch Vụ)
```
- category_id (PK)
- category_name
- description
- is_active
```

#### `room_services` (Phòng - Dịch Vụ Mapping)
```
- room_id (FK -> org_rooms)
- service_id (FK -> ref_services)
- Bảng gắn kết dịch vụ với phòng
```

#### `service_requests` (Đơn Đặt Dịch Vụ)
```
┌──────────────────────────────────┐
│   service_requests               │
│ (Đơn yêu cầu dịch vụ)           │
├──────────────────────────────────┤
│ request_id (UUID, PK)            │
│ encounter_id (FK)                │
│ requesting_doctor_id (FK)        │
│ notes (Ghi chú)                  │
│ created_at, deleted_at           │
└──────────────────────────────────┘
        ↓
   ┌────────────────────┐
   │ service_request_   │
   │ items              │
   ├────────────────────┤
   │ item_id (UUID, PK) │
   │ request_id (FK)    │
   │ service_id (FK)    │
   │ created_at         │
   └────────────────────┘
        ↓
(Tạo SERVICE queue ticket)
```

#### `service_results` (Kết Quả Dịch Vụ)
```
┌──────────────────────────────────┐
│   service_results                │
│ (Kết quả xét nghiệm/CLS)         │
├──────────────────────────────────┤
│ result_id (UUID, PK)             │
│ service_request_item_id (FK)     │
│ technician_id (FK -> staff)      │
│ result_data (JSON)               │
│ notes (Ghi chú)                  │
│ is_verified (Đã xác minh)        │
│ verified_by (FK -> staff)        │
│ verified_at (Ngày xác minh)      │
│ created_at, updated_at, del...   │
└──────────────────────────────────┘
        ↓
   ┌────────────────────┐
   │ result_images      │
   ├────────────────────┤
   │ image_id (UUID)    │
   │ result_id (FK)     │
   │ original_image_url │
   │ width, height      │
   │ created_at         │
   └────────────────────┘
        ↓
   (Tạo ảnh gốc)
```

---

### 5. **AI Integration Layer**

#### `annotation_projects` (Dự Án Annotation)
```
┌────────────────────────────────┐
│  annotation_projects           │
│ (Dự án phân loại ảnh)          │
├────────────────────────────────┤
│ project_id (UUID, PK)          │
│ project_name                   │
│ description                    │
│ created_by (FK -> staff)       │
│ is_active, created_at          │
└────────────────────────────────┘
```

#### `annotation_project_images` (Ảnh trong Dự Án)
```
- mapping_id (UUID, PK)
- project_id (FK)
- image_id (FK -> result_images)
```

#### `image_annotations` (Chú Thích Ảnh)
```
┌──────────────────────────────────────┐
│    image_annotations                 │
│ (Chú thích, phát hiện trên ảnh)      │
├──────────────────────────────────────┤
│ annotation_id (UUID, PK)             │
│ image_id (FK -> result_images)       │
│ annotation_source (ENUM):            │
│   - AI (Được AI tạo)                 │
│   - HUMAN (Người tạo)                │
│ annotation_status (ENUM):            │
│   - PENDING (Chờ duyệt)              │
│   - APPROVED (Đã duyệt)              │
│   - REJECTED (Bị từ chối)            │
│ annotation_data (JSON)               │
│ ai_model_name (Tên model AI)         │
│ ai_model_version                     │
│ labeled_at                           │
│ reviewed_by (FK -> staff)            │
│ created_at, deleted_at               │
└──────────────────────────────────────┘
```

---

## 🔄 Luồng Xử Lý Chính

### **LUỒNG 1: Quản Lý Xác Thực & Phân Quyền**

```
┌─────────────────────────────────────────────────────┐
│    AUTHENTICATION & AUTHORIZATION FLOW              │
└─────────────────────────────────────────────────────┘

1. ĐĂNG NHẬP (LOGIN)
   ├─ Client gửi: { username, password }
   ├─ System:
   │  ├─ Tìm user trong sys_users
   │  ├─ Verify password với argon2
   │  ├─ Xác định user_type (STAFF hay PATIENT)
   │  ├─ Nếu STAFF: lấy staff_profiles, role, assigned_room
   │  ├─ Nếu PATIENT: lấy patient_profiles
   │  └─ Tạo JWT payload gồm: sub, username, user_type, role, staff_id...
   └─ Response: { access_token, refresh_token }

2. REFRESH TOKEN
   ├─ Client gửi: { refresh_token }
   ├─ System:
   │  ├─ Verify refresh_token
   │  ├─ So sánh hash refresh_token với DB (refresh_token_hash)
   │  └─ Tạo access_token & refresh_token mới
   └─ Response: { access_token, refresh_token }

3. LOGOUT
   ├─ Client gửi: access_token (trong header Authorization)
   ├─ System:
   │  ├─ Xác thực JWT
   │  └─ Xóa/vô hiệu hóa refresh_token_hash
   └─ Response: { message: 'Success' }

4. AUTHORIZATION (KIỂM SOÁT QUYỀN TRUY CẬP)
   ├─ Guards: JwtAuthGuard, RoleGuard
   ├─ Decorators:
   │  ├─ @Public() - Không cần xác thực
   │  ├─ @CurrentUser() - Lấy thông tin user từ JWT
   │  └─ @Roles('ADMIN', 'DOCTOR') - Kiểm tra vai trò
   └─ Mỗi endpoint sẽ kiểm tra role trước khi execute
```

---

### **LUỒNG 2: Đăng Ký & Quản Lý Bệnh Nhân**

```
┌─────────────────────────────────────────────────────┐
│      PATIENT REGISTRATION & PROFILE MANAGEMENT      │
└─────────────────────────────────────────────────────┘

1. TẠO HỒ SƠ BỆNH NHÂN
   ├─ Tiếp đón (Receptionist) gửi yêu cầu
   ├─ System:
   │  ├─ Kiểm tra CCCD (ID Card):
   │  │  ├─ Nếu có: Tìm existing patient
   │  │  ├─ Nếu tìm thấy: Update thông tin
   │  │  └─ Nếu không: Tạo mới
   │  ├─ Tạo sys_user với username (từ CCCD hoặc phone)
   │  ├─ Hash password (nếu có) với argon2
   │  └─ Tạo patient_profiles
   └─ Response: Patient ID, created message

2. CẬP NHẬT HỒ SƠ BỆNH NHÂN
   ├─ Input: patient_id, { full_name, phone, address, ... }
   ├─ System:
   │  ├─ Tìm patient_profiles
   │  ├─ Update thông tin
   │  └─ Update sys_users nếu cần
   └─ Response: Updated patient info

3. XEM LỊCH SỬ KHÁM
   ├─ Input: patient_id
   ├─ System:
   │  ├─ Tìm tất cả encounters của patient
   │  ├─ Sort theo visit_date DESC
   │  └─ Include: doctor, room, status, final_icd
   └─ Response: Array of encounters
```

---

### **LUỘNG 3: Tiếp Đón & Xếp Hàng Chờ**

```
┌─────────────────────────────────────────────────────┐
│      RECEPTION & QUEUE MANAGEMENT FLOW              │
└─────────────────────────────────────────────────────┘

1. TẠO CUỘC KHÁM (CREATE ENCOUNTER)
   ├─ Tiếp đón gửi: { patient_id, doctor_id?, room_id?, ... }
   ├─ System:
   │  ├─ Validate patient_id, doctor_id, room_id
   │  ├─ Tạo medical_encounter
   │  │  ├─ current_status = REGISTERED
   │  │  ├─ visit_date = NOW()
   │  │  └─ Để trống vital signs, symptoms...
   │  └─ Tạo SERVICE_REQUEST cho dịch vụ khám ban đầu
   └─ Response: encounter_id

2. TẠO PHIẾU XẾP HÀNG (CREATE QUEUE TICKET)
   ├─ Input:
   │  ├─ room_id (Phòng đích)
   │  ├─ ticket_type (REGISTRATION, CONSULTATION, SERVICE)
   │  ├─ encounter_id (nếu là CONSULTATION/SERVICE)
   │  └─ source (ONLINE, WALKIN)
   │
   ├─ System:
   │  ├─ Validate room_id
   │  ├─ Validate encounter_id nếu CONSULTATION/SERVICE
   │  ├─ Lấy/Tạo QueueCounter cho room & ticket_type (hôm nay)
   │  ├─ Increment counter: last_number += 1
   │  ├─ Tạo queue_ticket:
   │  │  ├─ display_number = counter.last_number
   │  │  ├─ status = WAITING
   │  │  └─ Nếu SERVICE: gắn service_ids vào queue_ticket
   │  └─ Broadcast via WebSocket: Queue update
   │
   └─ Response: { ticket_id, display_number, status }

3. GỌI PHIẾU (CALL TICKET)
   ├─ Nhân viên phòng khám gửi: ticket_id
   ├─ System:
   │  ├─ Tìm queue_ticket
   │  ├─ Update:
   │  │  ├─ status = CALLED
   │  │  └─ called_at = NOW()
   │  ├─ Update encounter.current_status = IN_CONSULTATION (nếu có)
   │  └─ Broadcast via WebSocket
   │
   └─ Response: Updated ticket

4. BẮT ĐẦU KHÁM (START CONSULTATION)
   ├─ Bác sĩ gửi: encounter_id, vital_signs
   ├─ System:
   │  ├─ Update medical_encounter:
   │  │  ├─ weight, height, bmi
   │  │  ├─ temperature, pulse
   │  │  ├─ bp_systolic, bp_diastolic
   │  │  ├─ sp_o2, respiratory_rate
   │  │  └─ current_status = IN_CONSULTATION
   │  ├─ Update queue_ticket:
   │  │  ├─ status = IN_PROGRESS
   │  │  └─ started_at = NOW()
   │  └─ Broadcast via WebSocket
   │
   └─ Response: Updated encounter

5. HOÀN THÀNH KHÁM (COMPLETE CONSULTATION)
   ├─ Bác sĩ gửi: encounter_id, { doctor_conclusion, final_icd_code, ... }
   ├─ System:
   │  ├─ Update medical_encounter:
   │  │  ├─ doctor_conclusion = input
   │  │  ├─ final_icd_code = input
   │  │  └─ current_status = AWAITING_CLS (nếu có service orders)
   │  │              hoặc COMPLETED (nếu không có)
   │  ├─ Update queue_ticket:
   │  │  ├─ status = COMPLETED
   │  │  └─ completed_at = NOW()
   │  └─ Broadcast via WebSocket
   │
   └─ Response: Updated encounter

6. DASHBOARD PHÒNG (GET TODAY'S QUEUE)
   ├─ Input: room_id, ticket_type?, source?
   ├─ System:
   │  ├─ Tìm tất cả tickets hôm nay của room
   │  ├─ Filter theo ticket_type, source (nếu có)
   │  ├─ Group theo status: WAITING, CALLED, IN_PROGRESS, COMPLETED
   │  └─ Include: display_number, encounter info, patient info
   │
   └─ Response: Queue by status
```

---

### **LUỒNG 4: Đơn Đặt Dịch Vụ & Xét Nghiệm**

```
┌─────────────────────────────────────────────────────┐
│      SERVICE REQUEST & PARACLINICAL WORKFLOW        │
└─────────────────────────────────────────────────────┘

1. TẠO ĐƠN ĐẶT DỊCH VỤ
   ├─ Bác sĩ gửi yêu cầu:
   │  ├─ encounter_id
   │  ├─ requesting_doctor_id
   │  └─ items: [{ service_id }, ...]
   │
   ├─ System:
   │  ├─ Validate encounter, doctor, services
   │  ├─ Tạo service_request
   │  ├─ Tạo service_request_items (mỗi dịch vụ = 1 item)
   │  ├─ Tạo SERVICE queue_tickets cho mỗi phòng cung cấp dịch vụ
   │  │  ├─ Lấy phòng từ room_services
   │  │  ├─ ticket_type = SERVICE
   │  │  ├─ display_number = auto increment per room
   │  │  └─ service_ids = danh sách dịch vụ ở phòng đó
   │  └─ Update encounter.current_status = AWAITING_CLS
   │
   └─ Response: { request_id, items, service_ids }

2. XEM DỊCH VỤ PENDING (PHÒNG CLS)
   ├─ Input: room_id
   ├─ System:
   │  ├─ Tìm SERVICE queue_tickets:
   │  │  ├─ room_id = input
   │  │  ├─ status IN (WAITING, CALLED, IN_PROGRESS)
   │  │  └─ Lấy encounter & patient info
   │  └─ Group theo service_ids
   │
   └─ Response: Array of pending service items

3. THỰC HIỆN DỊCH VỤ (TECHNICIAN)
   ├─ Technician nhận phiếu queue SERVICE
   ├─ System:
   │  ├─ Capture vital signs, measurements
   │  ├─ Chụp ảnh/xét nghiệm
   │  └─ Update queue_ticket.status = IN_PROGRESS
   │
   └─ (Dữ liệu được lưu vào service_results & result_images)

4. NHẬP KẾT QUẢ DỊCH VỤ
   ├─ Technician gửi:
   │  ├─ service_request_item_id
   │  ├─ result_data (JSON)
   │  ├─ ảnh kết quả
   │  └─ notes
   │
   ├─ System:
   │  ├─ Tạo service_result
   │  ├─ Upload ảnh lên Cloudinary → result_images
   │  ├─ Nếu ảnh: Tạo result_image record
   │  ├─ Update queue_ticket.status = COMPLETED
   │  ├─ Kiểm tra tất cả service items xong chưa:
   │  │  ├─ Nếu xong hết: encounter.current_status = RESULTS_READY
   │  │  └─ Nếu còn: status vẫn = AWAITING_CLS
   │  └─ Broadcast via WebSocket
   │
   └─ Response: { result_id, image_urls, ... }
```

---

### **LUỘNG 5: Tích Hợp AI cho Phát Hiện & Chú Thích Ảnh**

```
┌─────────────────────────────────────────────────────┐
│         AI ANNOTATION & DETECTION FLOW              │
└─────────────────────────────────────────────────────┘

1. CHẠY AI DETECTION TRÊN ẢNH
   ├─ Input:
   │  ├─ image_id (từ result_images)
   │  ├─ model_name (ví dụ: 'yolov8', 'faster_rcnn')
   │  └─ confidence (ngưỡng độ tin cây)
   │
   ├─ System:
   │  ├─ Lấy result_image record
   │  ├─ Gửi POST /detect/url đến AI service:
   │  │  ├─ image_url
   │  │  ├─ model_name
   │  │  └─ confidence_threshold
   │  ├─ Nhận response: { detections: [...], model, ... }
   │  ├─ Tạo image_annotation:
   │  │  ├─ image_id = input
   │  │  ├─ annotation_source = AI
   │  │  ├─ annotation_data = response.detections
   │  │  ├─ ai_model_name, ai_model_version
   │  │  ├─ annotation_status = APPROVED (tự động approved)
   │  │  └─ labeled_at = NOW()
   │  └─ Broadcast via WebSocket
   │
   └─ Response: { annotation_id, detections, confidence_score }

2. CHỈNH SỬA CHÍNH TẢ THỰ CÔNG (HUMAN ANNOTATION)
   ├─ Bác sĩ/Expert gửi:
   │  ├─ image_id
   │  ├─ annotation_data (thay đổi từ AI)
   │  └─ notes
   │
   ├─ System:
   │  ├─ Kiểm tra xem đã có annotation chưa
   │  │  ├─ Nếu có: Update annotation_data, annotation_status = PENDING
   │  │  └─ Nếu không: Tạo mới với annotation_source = HUMAN
   │  ├─ Ghi lại lịch sử thay đổi
   │  └─ Đánh dấu cần duyệt
   │
   └─ Response: Updated annotation

3. DUYỆT CHANT THÍCH (APPROVAL WORKFLOW)
   ├─ Reviewer (Bác sĩ senior) xem annotation
   ├─ System:
   │  ├─ Lấy image_annotation với status = PENDING
   │  ├─ Show annotation_data & annotation_source
   │  ├─ Reviewer có 3 tùy chọn:
   │  │
   │  ├─ A) APPROVE
   │  │  ├─ Update annotation_status = APPROVED
   │  │  ├─ reviewed_by = reviewer_id
   │  │  └─ Ghi lại lịch sử
   │  │
   │  ├─ B) REJECT
   │  │  ├─ Update annotation_status = REJECTED
   │  │  ├─ reviewed_by = reviewer_id
   │  │  ├─ Ghi lại lý do từ chối
   │  │  └─ Yêu cầu update annotation
   │  │
   │  └─ C) REQUEST_MODIFICATION
   │     ├─ Gửi feedback cho người chỉnh sửa
   │     └─ annotation_status = PENDING (vẫn chờ)
   │
   └─ Response: Updated annotation status

4. QUẢN LÝ DỰ ÁN ANNOTATION
   ├─ Admin/Manager tạo dự án:
   │  ├─ { project_name, description, ... }
   │  └─ Tạo annotation_project
   │
   ├─ Thêm ảnh vào dự án:
   │  ├─ Input: project_id, image_ids
   │  └─ Tạo annotation_project_images records
   │
   ├─ Xem tiến độ dự án:
   │  ├─ Tính %:
   │  │  ├─ APPROVED / total_images * 100
   │  │  ├─ PENDING / total_images * 100
   │  │  └─ REJECTED / total_images * 100
   │  └─ Gợi ý những ảnh cần chỉnh sửa
   │
   └─ Export kết quả:
      ├─ Tạo ZIP archive
      ├─ Bao gồm:
      │  ├─ Tất cả ảnh APPROVED
      │  ├─ JSON manifests chứa annotations
      │  └─ Metadata
      └─ Response: Download link

5. TOGGLE DEPRECATE (TỚI HẠN CHÚT THÍCH)
   ├─ Nếu nhận thấy annotation cũ/sai
   ├─ System:
   │  ├─ Update annotation_status = DEPRECATED (hoặc delete soft)
   │  └─ Có thể tạo mới từ dịch vụ AI khác
   │
   └─ Response: Updated annotation
```

---

### **LUỘNG 6: Quản Lý Hệ Thống**

```
┌─────────────────────────────────────────────────────┐
│            SYSTEM MANAGEMENT FLOW                   │
└─────────────────────────────────────────────────────┘

1. QUẢN LÝ PHÒNG KHÁM (ORG_ROOMS)
   ├─ Admin có thể:
   │  ├─ Tạo/Sửa/Xóa phòng khám
   │  ├─ Gán loại phòng (CASHIER, CONSULTATION, SERVICE)
   │  ├─ Activate/Deactivate phòng
   │  └─ Gắn dịch vụ vào phòng (room_services mapping)
   │
   └─ Hệ thống sử dụng:
      ├─ room_id để tạo queue tickets
      ├─ room_type để xác định nghiệp vụ
      └─ room_services để tìm phòng thực hiện dịch vụ

2. QUẢN LÝ DỊCH VỤ (REF_SERVICES)
   ├─ Admin có thể:
   │  ├─ Tạo/Sửa/Xóa dịch vụ
   │  ├─ Đặt giá dịch vụ (unit_price)
   │  ├─ Phân loại dịch vụ (categories)
   │  ├─ Gắn dịch vụ vào phòng
   │  └─ Activate/Deactivate dịch vụ
   │
   └─ Hệ thống sử dụng:
      ├─ service_id để tạo service_request_items
      ├─ unit_price để tính hóa đơn
      └─ room_services để định tuyến

3. QUẢN LÝ NHÂN VIÊN (STAFF_PROFILES)
   ├─ Admin có thể:
   │  ├─ Tạo/Sửa/Xóa nhân viên
   │  ├─ Gán vai trò (ADMIN, DOCTOR, TECHNICIAN, RECEPTIONIST)
   │  ├─ Gán phòng làm việc
   │  ├─ Lưu thông tin cấp chứng (license_number)
   │  └─ Activate/Deactivate nhân viên
   │
   └─ Hệ thống sử dụng:
      ├─ role để phân quyền
      ├─ assigned_room_id để xác định nơi làm việc
      └─ staff_id để ghi nhận người thực hiện

4. QUẢN LÝ BỆNH NHÂN (PATIENT_PROFILES)
   ├─ Tiếp đón có thể:
   │  ├─ Tạo hồ sơ bệnh nhân mới
   │  ├─ Cập nhật thông tin bệnh nhân
   │  ├─ Xem lịch sử khám
   │  └─ Xóa/Deactivate hồ sơ (soft delete)
   │
   └─ Hệ thống sử dụng:
      ├─ patient_id để liên kết encounters
      ├─ CCCD để duplicate check
      └─ created_by để ghi nhận người tạo

5. DATABASE MIGRATION & SEEDING
   ├─ Migration:
   │  ├─ npm run migration:generate (tạo migration từ schema)
   │  ├─ npm run migration:run (chạy migration)
   │  └─ npm run migration:revert (quay lại)
   │
   ├─ Seeding:
   │  ├─ npm run seed:run (chạy seed)
   │  ├─ npm run seed:refresh (xóa + tạo lại)
   │  └─ npm run db:fresh (reset toàn bộ DB)
   │
   └─ Production:
      ├─ Chỉ chạy migration:run
      └─ Không chạy seed trên production
```

---

## 🔐 Security Features

1. **Authentication**
   - JWT tokens với expiration
   - Refresh token rotation
   - Password hashing với Argon2
   - Secure password storage (select=false)

2. **Authorization**
   - Role-based access control (RBAC)
   - Route guards (@UseGuards, @Roles)
   - Public/Private endpoints (@Public decorator)

3. **Data Protection**
   - Soft delete (deleted_at column) để bảo vệ dữ liệu
   - Database transactions cho consistency
   - Input validation với class-validator

4. **File Upload Security**
   - Upload qua Cloudinary (cloud storage)
   - Original URL lưu trong DB
   - Hạn chế file size

---

## 📊 Database Entities Tóm Tắt

| Entity | Purpose | Relations |
|--------|---------|-----------|
| **sys_users** | Người dùng | 1→1 staff_profiles, 1→1 patient_profiles |
| **staff_profiles** | Hồ sơ nhân viên | FK: sys_users, sys_roles, org_rooms |
| **patient_profiles** | Hồ sơ bệnh nhân | FK: sys_users, created_by (staff) |
| **medical_encounters** | Lịch sử khám | FK: patient, doctor, room, icd10 |
| **queue_tickets** | Phiếu xếp hàng | FK: encounter, room |
| **queue_counters** | Bộ đếm phiếu | FK: room |
| **ref_services** | Danh sách dịch vụ | FK: category |
| **service_requests** | Đơn dịch vụ | FK: encounter, doctor |
| **service_request_items** | Chi tiết đơn | FK: request, service |
| **service_results** | Kết quả dịch vụ | FK: request_item, technician, verified_by |
| **result_images** | Ảnh kết quả | FK: result |
| **image_annotations** | Chú thích ảnh | FK: image, reviewed_by |
| **annotation_projects** | Dự án AI | FK: created_by |
| **annotation_project_images** | Ảnh trong dự án | FK: project, image |

---

## 🚀 API Endpoints Overview

### Authentication
- `POST /auth/login` - Đăng nhập
- `POST /auth/refresh` - Làm mới token
- `POST /auth/logout` - Đăng xuất

### Clinical
- `POST /clinical/encounters` - Tạo cuộc khám
- `GET /clinical/encounters` - Danh sách encounters
- `PATCH /clinical/encounters/:id` - Cập nhật encounter
- `POST /clinical/encounters/:id/start-consultation` - Bắt đầu khám
- `POST /clinical/encounters/:id/complete-consultation` - Hoàn thành khám

### Reception
- `POST /reception/queue/tickets` - Tạo phiếu xếp hàng
- `GET /reception/queue/tickets/today/:roomId` - Danh sách hôm nay
- `PATCH /reception/queue/tickets/:id` - Cập nhật phiếu

### Paraclinical Services
- `GET /services` - Danh sách dịch vụ
- `POST /service-orders` - Tạo đơn dịch vụ
- `POST /results` - Nhập kết quả
- `POST /results/images/upload` - Upload ảnh kết quả

### AI Core
- `POST /ai-core/detect/image` - Phát hiện từ ảnh
- `POST /ai-core/annotations` - Tạo chú thích
- `PATCH /ai-core/annotations/:id/approve` - Duyệt chú thích
- `GET /ai-core/projects/:id/progress` - Xem tiến độ dự án
- `POST /ai-core/annotations/export` - Export kết quả

---

## 🔄 WebSocket Events (Real-time)

```typescript
// Queue updates
queue:ticket-created
queue:ticket-updated
queue:ticket-called
queue:ticket-completed

// Service updates
service:request-created
service:result-updated
service:image-uploaded

// Annotation updates
annotation:created
annotation:approved
annotation:rejected
```

---

## 📝 Status Enums Summary

| Entity | Statuses |
|--------|----------|
| **EncounterStatus** | REGISTERED → AWAITING_PAYMENT → IN_CONSULTATION → AWAITING_CLS → IN_CLS → CLS_COMPLETED → RESULTS_READY → COMPLETED |
| **QueueStatus** | WAITING → CALLED → IN_PROGRESS → COMPLETED (SKIPPED) |
| **QueueTicketType** | REGISTRATION, CONSULTATION, SERVICE |
| **AnnotationStatus** | PENDING, APPROVED, REJECTED, DEPRECATED |
| **AnnotationSource** | AI, HUMAN |
| **QueueSource** | ONLINE, WALKIN |

---

## 🎯 Key Business Rules

1. **Encounter Flow**
   - Mỗi bệnh nhân khi đến phòng khám tạo 1 encounter
   - Encounter theo dõi toàn bộ hành trình từ đăng ký → khám → xét nghiệm → results ready

2. **Queue Management**
   - Mỗi phòng có counter riêng cho từng loại phiếu (REGISTRATION, CONSULTATION, SERVICE)
   - Counter reset hàng ngày
   - Display number = số hiển thị trên màn hình (A1, A2, B1, v.v.)

3. **Service Request**
   - Bác sĩ yêu cầu dịch vụ qua service_request
   - Mỗi dịch vụ = 1 service_request_item
   - Tạo SERVICE queue tickets cho các phòng thực hiện

4. **AI Annotation**
   - AI có thể auto-detect & tạo annotations
   - Annotations cần duyệt trước khi dùng cho training
   - Support human override & modification

5. **Security**
   - Nhân viên chỉ thấy bệnh nhân/dữ liệu ở phòng của họ (assigned_room_id)
   - Bác sĩ chỉ thấy encounters mà họ quản lý
   - Admin có quyền toàn hệ thống

---

## 📦 Dependencies & Versions

```json
{
  "@nestjs/core": "^11.0.1",
  "@nestjs/jwt": "^11.0.2",
  "@nestjs/typeorm": "^11.0.0",
  "typeorm": "^0.3.28",
  "pg": "^8.16.3",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "argon2": "^0.44.0",
  "cloudinary": "^2.8.0",
  "axios": "^1.13.2"
}
```

---

## 🏁 Conclusion

**TN Clinic Management Backend** là một hệ thống quản lý phòng khám toàn diện với các tính năng:
- ✅ Quản lý bệnh nhân & nhân viên
- ✅ Xếp hàng chờ & quản lý encounters
- ✅ Đơn đặt dịch vụ & kết quả xét nghiệm
- ✅ Tích hợp AI cho phát hiện & chú thích ảnh
- ✅ Real-time updates via WebSocket
- ✅ Role-based access control
- ✅ Audit trail với soft delete

Hệ thống thiết kế để hỗ trợ hiệu quả quy trình khám chữa bệnh từ tiếp đón → khám lâm sàng → xét nghiệm → có kết quả → hoàn tất.
