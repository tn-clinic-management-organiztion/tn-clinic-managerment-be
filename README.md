# TN Clinic Management Backend

Backend API cho hệ thống quản lý phòng khám tích hợp AI, được xây dựng bằng **NestJS**, **PostgreSQL**, **TypeORM** và tích hợp **Cloudinary** cho quản lý ảnh.

## 📋 Thông tin dự án

- **Tech Stack**: NestJS 11, TypeORM 0.3.x, PostgreSQL 16+, JWT, Cloudinary, AI service
- **Port mặc định**: 8080
- **Base URL**: `http://localhost:8080`
- **Swagger UI**: `http://localhost:8080/api-docs`

## 🔧 Biến môi trường cần thiết

Tạo file `.env` tại thư mục gốc với các biến sau:

```env
# App
PORT=8080

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_database_name

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_EXPIRY=1d
JWT_REFRESH_EXPIRY=7d

# Cloudinary (nếu dùng upload ảnh)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI service (nếu dùng AI Core)
AI_SERVICE_URL=http://localhost:8000/api/v1

# Upload (tùy chọn)
MAX_FILE_SIZE=10485760
```

**Lưu ý**:
- Bắt buộc: `PORT`, `DB_*`, `JWT_SECRET`
- Tùy chọn nhưng khuyến nghị: `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `MAX_FILE_SIZE`
- Theo module: `CLOUDINARY_*` (cho upload ảnh), `AI_SERVICE_URL` (cho AI core)

## 📜 Scripts chính

Từ `package.json`, các lệnh quan trọng:

```bash
# Server
npm run start:dev          # Chạy server development (watch mode)
npm run start:prod         # Chạy server production

# Migration
npm run migration:run      # Chạy migration tạo schema DB
npm run migration:revert   # Revert migration gần nhất
npm run migration:show     # Xem trạng thái migration

# Seeding
npm run seed:run           # Chạy seed dữ liệu mẫu
npm run migration:run:seed # Migration + seed (khuyến nghị lần đầu)
npm run db:fresh           # Reset DB + migration + seed (dev only)
```

## 🚀 Chạy dự án ở local (step-by-step)

### Bước 1: Chuẩn bị môi trường
- Cài đặt Node.js, PostgreSQL
- Tạo database PostgreSQL trống
- Sao chép file `.env` và điền thông tin DB

### Bước 2: Cài đặt dependencies
```bash
git clone <repository-url>
cd TN-Clinic-Managerment-BE
npm install
```

### Bước 3: Khởi tạo database
Lần đầu setup:
```bash
npm run migration:run:seed
```

Nếu cần reset toàn bộ dữ liệu dev:
```bash
npm run db:fresh
```

### Bước 4: Chạy server
```bash
npm run start:dev
```

Sau khi chạy thành công:
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/api-docs`

## 🐳 Chạy với Docker

### Sử dụng Docker Compose
```bash
docker-compose up --build
```

Docker Compose sẽ tự động:
- Build image backend
- Khởi động PostgreSQL
- Chạy migration và seed
- Expose port 8080

### Build image riêng
```bash
# Build image
docker build -t tn-clinic-be .

# Chạy container
docker run -p 8080:8080 --env-file .env tn-clinic-be
```

## 📁 Cấu trúc thư mục

```
TN-Clinic-Managerment-BE/
├── src/
│   ├── app.module.ts          # Root module
│   ├── main.ts                # Entry point
│   ├── config/                # Cấu hình (auth, cloudinary, swagger, typeorm)
│   ├── common/                # Shared components (guards, interceptors, decorators)
│   ├── database/
│   │   ├── entities/          # TypeORM entities
│   │   ├── migrations/        # DB migrations
│   │   ├── seeds/             # Seed data
│   │   └── seed.ts            # Seed runner
│   ├── modules/               # Business modules
│   │   ├── ai-core/           # AI integration
│   │   ├── auth/              # Authentication
│   │   ├── clinical/          # Clinical management
│   │   ├── iam/               # Identity & Access Management
│   │   ├── paraclinical/      # Paraclinical services
│   │   ├── queue/             # Queue management
│   │   ├── reception/         # Reception
│   │   └── system/            # System settings
│   ├── shared/                # Shared utilities
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utility functions
├── test/                      # Tests
├── docker-compose.yaml        # Docker Compose config
├── Dockerfile                 # Docker build config
└── package.json               # Dependencies & scripts
```