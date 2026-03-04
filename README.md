# TN Clinic Management Backend

Backend API cho hệ thống quản lý phòng khám sử dụng NestJS, TypeORM, PostgreSQL và tích hợp AI.

## 📋 Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Biến môi trường](#biến-môi-trường)
- [Cài đặt và chạy Local](#cài-đặt-và-chạy-local)
- [Chạy với Docker](#chạy-với-docker)
- [Migration Database](#migration-database)
- [API Documentation](#api-documentation)

## 🛠️ Yêu cầu hệ thống

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **PostgreSQL**: >= 16.x
- **Docker** (tùy chọn): >= 20.x
- **Docker Compose** (tùy chọn): >= 2.x

## 📁 Cấu trúc thư mục

```
TN-Clinic-Managerment-BE/
├── src/
│   ├── common/              # Shared components
│   │   ├── decorators/      # Custom decorators (CurrentUser, Roles, Public, etc.)
│   │   ├── filters/         # Exception filters
│   │   ├── guards/          # Auth guards (JWT, Local, Role)
│   │   ├── interceptor/     # Response interceptors
│   │   ├── middleware/      # Custom middleware
│   │   └── strategies/      # Passport strategies
│   ├── config/              # Configuration files
│   │   ├── auth.config.ts   # JWT configuration
│   │   ├── cloudinary.config.ts
│   │   ├── swagger.config.ts
│   │   ├── typeorm.config.ts
│   │   └── upload.config.ts
│   ├── constants/           # Application constants
│   ├── database/
│   │   ├── entities/        # TypeORM entities
│   │   └── seeds/           # Database seeds
│   ├── migrations/          # Database migrations
│   ├── modules/             # Feature modules
│   │   ├── ai-core/         # AI integration module
│   │   ├── clinical/        # Clinical management
│   │   ├── iam/             # Identity & Access Management
│   │   ├── paraclinical/    # Paraclinical services
│   │   ├── reception/       # Reception/Queue management
│   │   └── system/          # System settings
│   ├── shared/              # Shared utilities
│   │   ├── cloudinary/      # Cloudinary service
│   │   └── Tables/          # Table definitions
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry point
├── dist/                    # Compiled JavaScript files
├── test/                    # E2E tests
├── docker-compose.yaml      # Docker Compose configuration
├── Dockerfile               # Docker image definition
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Biến môi trường

Tạo file `.env` ở thư mục gốc với các biến sau:

```env
# Server Configuration
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_database_name

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_ACCESS_EXPIRY=1d
JWT_REFRESH_EXPIRY=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000/api/v1

# File Upload Configuration (optional)
MAX_FILE_SIZE=10485760
```

### Giải thích các biến môi trường

- **PORT**: Port mà server sẽ chạy (mặc định: 8080)
- **DB_***: Thông tin kết nối PostgreSQL
- **JWT_***: Cấu hình JWT authentication
- **CLOUDINARY_***: Thông tin Cloudinary cho upload ảnh
- **AI_SERVICE_URL**: URL của AI service (nếu có)
- **MAX_FILE_SIZE**: Kích thước file tối đa (bytes, mặc định: 10MB)

## 💻 Cài đặt và chạy Local

### 1. Clone repository

```bash
git clone <repository-url>
cd TN-Clinic-Managerment-BE
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` và điền các biến môi trường như đã mô tả ở trên.

### 4. Setup Database

Đảm bảo PostgreSQL đang chạy và tạo database:

```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE your_database_name;
```

### 5. Chạy migrations

```bash
# Build project trước
npm run build

# Chạy migrations
npm run migration:run
```

### 6. Chạy ứng dụng

```bash
# Development mode (với hot-reload)
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

Ứng dụng sẽ chạy tại: **http://localhost:8080**

API Documentation (Swagger): **http://localhost:8080/api-docs**

## 🐳 Chạy với Docker

### 1. Cấu hình môi trường

Tạo file `.env` với các biến môi trường. Lưu ý:
- `DB_HOST` sẽ được override thành `postgres_db` trong Docker
- `PORT` phải khớp với port mapping trong docker-compose.yaml

### 2. Build và chạy với Docker Compose

```bash
# Build và khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f backend

# Dừng services
docker-compose down

# Dừng và xóa volumes (xóa dữ liệu)
docker-compose down -v
```

### 3. Chạy migrations trong Docker

```bash
# Vào container backend
docker exec -it backend sh

# Chạy migrations
npm run migration:run
```

Hoặc chạy trực tiếp từ host:

```bash
docker exec -it backend npm run migration:run
```

### 4. Các services trong Docker Compose

- **backend**: Ứng dụng NestJS (port: 8080)
- **postgres_db**: PostgreSQL database (port: 5432)
- **redis**: Redis cache (port: 6379)
- **rabbitmq**: RabbitMQ message broker
  - AMQP: port 5672
  - Management UI: http://localhost:15672 (admin/pass)

### 5. Kiểm tra trạng thái

```bash
# Kiểm tra containers đang chạy
docker-compose ps

# Kiểm tra logs của một service
docker-compose logs backend
docker-compose logs postgres_db
```

## 🔄 Migration Database

### Tạo migration mới

```bash
# Tạo migration trống
npm run migration:create -- src/migrations/YourMigrationName

# Tạo migration tự động từ thay đổi entities
npm run migration:generate -- src/migrations/YourMigrationName
```

### Chạy migrations

```bash
# Chạy tất cả migrations chưa chạy
npm run migration:run

# Revert migration gần nhất
npm run migration:revert

# Xem trạng thái migrations
npm run migration:show
```

### Lưu ý khi chạy migrations

1. **Luôn build project trước khi chạy migration:**
   ```bash
   npm run build
   npm run migration:run
   ```

2. **Trong Docker:**
   ```bash
   docker exec -it backend npm run build
   docker exec -it backend npm run migration:run
   ```

3. **Kiểm tra migrations đã chạy:**
   ```bash
   npm run migration:show
   ```


   ## ⚠️ Cảnh báo — Script reset/refresh Database

   Trong `package.json` có một số script thực hiện thao tác xóa/dọn sạch database rồi chạy lại migration và seed. Những script này sẽ xóa dữ liệu hiện có trong database và nạp lại dữ liệu mẫu. Hãy chắc chắn sao lưu dữ liệu trước khi chạy trên môi trường quan trọng.

   Các script quan trọng:

   - `npm run db:reset` — Chạy `src/database/reset-db.ts` (thường dọn sạch hoặc reset database).
   - `npm run seed:run` — Chạy `src/database/seed.ts` để nạp dữ liệu mẫu (seed).
   - `npm run db:fresh` — Thực hiện tuần tự: `db:reset` -> `migration:run` -> `seed:run`. Tương đương với:

   ```bash
   npm run db:reset && npm run migration:run && npm run seed:run
   ```

   - `npm run migration:run:seed` — Chạy migration rồi chạy seed.

   Ví dụ sử dụng an toàn:

   - Chỉ cập nhật schema (không xóa dữ liệu):

   ```bash
   npm run migration:run
   ```

   - Làm mới toàn bộ database (CẢNH BÁO: xóa dữ liệu hiện tại):

   ```bash
   npm run db:fresh
   ```

   Lưu ý cho môi trường production:

   - KHÔNG chạy `db:reset`, `db:fresh` hoặc các script xóa dữ liệu trên database production.
   - Nếu cần migration trên production, chỉ chạy `npm run migration:run` và thực hiện backup trước.

   Kiểm tra kỹ `NODE_ENV` hoặc biến môi trường trước khi chạy các script này.

## 🚀 Scripts có sẵn

```bash
# Development
npm run start:dev          # Chạy với hot-reload
npm run start:debug        # Chạy với debug mode

# Production
npm run build              # Build project
npm run start:prod         # Chạy production mode

# Database
npm run migration:create   # Tạo migration mới
npm run migration:generate # Generate migration từ entities
npm run migration:run      # Chạy migrations
npm run migration:revert   # Revert migration
npm run migration:show     # Xem trạng thái migrations

# Testing
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Test coverage

# Code quality
npm run lint               # Lint code
npm run format             # Format code với Prettier
```

## 🔧 Troubleshooting

### Lỗi kết nối database

- Kiểm tra PostgreSQL đang chạy
- Kiểm tra thông tin kết nối trong `.env`
- Trong Docker, đảm bảo `DB_HOST=postgres_db`

### Lỗi migration

- Đảm bảo đã build project: `npm run build`
- Kiểm tra kết nối database
- Xem logs chi tiết: `npm run migration:show`

### Port 8080 đã được sử dụng

- Thay đổi `PORT` trong `.env`
- Hoặc dừng service đang dùng port 8080

### Lỗi trong Docker

- Kiểm tra logs: `docker-compose logs backend`
- Đảm bảo `.env` file tồn tại
- Rebuild images: `docker-compose up -d --build`

## 📄 License

UNLICENSED
