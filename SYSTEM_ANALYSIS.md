# TN Clinic Management Backend - Phân Tích Hệ Thống

## 📋 Tổng quan hệ thống

**TN Clinic Management Backend** là hệ thống backend quản lý phòng khám tích hợp AI, được xây dựng bằng NestJS, PostgreSQL và TypeORM. Hệ thống cung cấp API RESTful cho việc quản lý bệnh nhân, nhân viên, lịch khám, dịch vụ y tế và tích hợp AI cho phân tích hình ảnh.

## 🏗️ Kiến trúc hệ thống

### Tech Stack
- **Backend Framework**: NestJS 11 (TypeScript)
- **Database**: PostgreSQL 16+
- **ORM**: TypeORM 0.3.x
- **Authentication**: JWT + Passport
- **File Storage**: Cloudinary
- **AI Integration**: External AI service
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

### Cấu trúc Module
```
src/
├── modules/
│   ├── auth/          # Xác thực & phân quyền
│   ├── clinical/      # Quản lý khám chữa bệnh
│   ├── queue/         # Hệ thống xếp hàng
│   ├── paraclinical/  # Dịch vụ cận lâm sàng
│   ├── reception/     # Lễ tân
│   ├── iam/           # Quản lý danh tính
│   ├── ai-core/       # Tích hợp AI
│   └── system/        # Cấu hình hệ thống
```

## 💾 Cấu trúc Database

### Core Entities

#### 1. Authentication & Authorization
- **sys_users**: Thông tin tài khoản người dùng
- **sys_roles**: Vai trò hệ thống (Admin, Doctor, Nurse, Receptionist, etc.)
- **staff_profiles**: Hồ sơ nhân viên y tế
- **patient_profiles**: Hồ sơ bệnh nhân

#### 2. Organization
- **org_rooms**: Phòng khám và phòng chức năng
- **ref_specialties**: Chuyên khoa y tế

#### 3. Clinical Management
- **medical_encounters**: Lượt khám bệnh
  - Status: `REGISTERED`, `AWAITING_PAYMENT`, `IN_CONSULTATION`, `COMPLETED`
- **ref_icd10**: Danh mục chẩn đoán ICD-10

#### 4. Queue Management
- **queue_tickets**: Phiếu xếp hàng
  - Type: `REGISTRATION`, `CONSULTATION`, `SERVICE`
  - Source: `ONLINE`, `WALKIN`
  - Status: `WAITING`, `CALLED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`
- **queue_counters**: Bộ đếm số thứ tự cho từng phòng

#### 5. Service Management
- **ref_service_categories**: Nhóm dịch vụ y tế
- **ref_services**: Danh sách dịch vụ cụ thể
- **room_services**: Dịch vụ theo phòng
- **service_requests**: Đơn yêu cầu dịch vụ
- **service_request_items**: Chi tiết dịch vụ trong đơn
- **service_results**: Kết quả dịch vụ
- **result_images**: Hình ảnh kết quả
- **ticket_service_items**: Liên kết phiếu và dịch vụ

#### 6. AI Integration
- **annotation_projects**: Dự án chú thích AI
  - Task Types: `CLASSIFICATION`, `BOUNDING_BOX`, `SEGMENTATION`, `KEYPOINT`, `OCR`, `OTHER`
- **annotation_project_images**: Hình ảnh trong dự án AI
- **image_annotations**: Chú thích trên hình ảnh

#### 7. Scheduling
- **staff_room_schedules**: Lịch làm việc của nhân viên theo phòng

### Entity Relationships

```
SysUser (1) ──── (1) StaffProfile/PatientProfile
    │
    └── (N) MedicalEncounter
        │
        ├── (1) StaffProfile (Doctor)
        ├── (1) OrgRoom
        ├── (1) RefIcd10
        └── (N) ServiceRequest
            │
            └── (N) ServiceRequestItem
                │
                ├── (1) RefService
                └── (1) ServiceResult
                    │
                    └── (N) ResultImage
                        │
                        └── (N) ImageAnnotation

QueueTicket (N) ──── (1) MedicalEncounter
    │
    └── (N) TicketServiceItem
        │
        └── (1) ServiceRequestItem

AnnotationProject (1) ──── (N) AnnotationProjectImage
    │
    └── (1) ResultImage
```

## 🔄 Business Flows

### 1. Patient Registration Flow
1. Bệnh nhân đăng ký → Tạo `patient_profiles`
2. Tạo `medical_encounters` với status `REGISTERED`
3. Tạo `queue_tickets` với type `REGISTRATION`

### 2. Consultation Flow
1. Gọi số → Cập nhật `queue_tickets` status thành `IN_PROGRESS`
2. Bác sĩ khám → Cập nhật vital signs trong `medical_encounters`
3. Yêu cầu dịch vụ → Tạo `service_requests` và `service_request_items`
4. Hoàn thành khám → Cập nhật status `medical_encounters` thành `COMPLETED`

### 3. Service Execution Flow
1. Thực hiện dịch vụ → Cập nhật `service_results`
2. Upload hình ảnh → Tạo `result_images`
3. AI phân tích (tùy chọn) → Tạo `annotation_projects` và `image_annotations`

### 4. Queue Management Flow
- **Registration Queue**: Xử lý đăng ký ban đầu
- **Consultation Queue**: Xử lý khám bệnh
- **Service Queue**: Xử lý các dịch vụ cận lâm sàng

## 🔐 Authentication & Authorization

### Roles
- **ADMIN**: Quản trị hệ thống
- **DOCTOR**: Bác sĩ
- **NURSE**: Y tá
- **RECEPTIONIST**: Lễ tân
- **TECHNICIAN**: Kỹ thuật viên
- **PATIENT**: Bệnh nhân

### Guards
- **JWT Guard**: Xác thực token
- **Role Guard**: Kiểm tra quyền truy cập
- **Public Guard**: Cho phép truy cập công khai

## 📊 Key Status & Types

### Encounter Status
- `REGISTERED`: Đã đăng ký
- `AWAITING_PAYMENT`: Chờ thanh toán
- `IN_CONSULTATION`: Đang khám
- `COMPLETED`: Hoàn thành

### Queue Ticket Types
- `REGISTRATION`: Đăng ký
- `CONSULTATION`: Khám bệnh
- `SERVICE`: Dịch vụ

### Queue Sources
- `ONLINE`: Đặt lịch online
- `WALKIN`: Đến trực tiếp

### Queue Status
- `WAITING`: Đang chờ
- `CALLED`: Đã gọi
- `IN_PROGRESS`: Đang xử lý
- `COMPLETED`: Hoàn thành
- `SKIPPED`: Bỏ qua

### AI Task Types
- `CLASSIFICATION`: Phân loại
- `BOUNDING_BOX`: Hộp giới hạn
- `SEGMENTATION`: Phân đoạn
- `KEYPOINT`: Điểm chính
- `OCR`: Nhận dạng văn bản
- `OTHER`: Khác

## 🔧 Configuration & Environment

### Required Environment Variables
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `AI_SERVICE_URL` (optional)

### Database Migrations
- Tự động generate từ entity changes
- Version controlled trong `src/migrations/`
- Scripts: `migration:run`, `migration:revert`, `migration:show`

### Seeding
- Initial data trong `src/database/seeds/`
- Roles, users, reference data
- Scripts: `seed:run`, `db:fresh`

## 🚀 Deployment

### Local Development
```bash
npm install
npm run migration:run:seed
npm run start:dev
```

### Docker Deployment
```bash
docker-compose up --build
```

### Production Considerations
- Environment isolation
- Database backup strategies
- Monitoring & logging
- Security hardening

## 📈 Monitoring & Maintenance

### Key Metrics
- API response times
- Database query performance
- Queue processing times
- Error rates

### Maintenance Tasks
- Database cleanup (soft deletes)
- Migration verification
- Backup validation
- Log rotation

---