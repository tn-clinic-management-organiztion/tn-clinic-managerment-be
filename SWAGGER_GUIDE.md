# Hướng Dẫn Sử Dụng Swagger Decorators trong NestJS

## Tổng Quan

Swagger (OpenAPI) giúp tạo tài liệu API tự động cho NestJS. Dưới đây là hướng dẫn đầy đủ về các decorator phổ biến, kèm ví dụ thực tế.

## Cấu Hình Cơ Bản

### 1. Cấu Hình Swagger trong `swagger.config.ts`

```typescript
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('TN Clinic Management API')
    .setDescription('API documentation for TN Clinic Management System')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập access token theo format: Bearer {token}',
        in: 'header',
      },
      'access-token', // Tên security scheme
    )
    .addServer('http://localhost:8080', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Giữ token sau khi refresh
      displayRequestDuration: true, // Hiển thị thời gian request
    },
  });
}
```

### 2. Gọi trong `main.ts`

```typescript
import { configSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ... other configs
  configSwagger(app); // Thêm dòng này
  await app.listen(8080);
}
```

## Các Decorator Theo Loại API

### 1. Decorator Cho Controller (Class Level)

```typescript
import { ApiTags, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';

@ApiTags('User Management') // Nhóm API
@ApiBearerAuth('access-token') // Xác thực Bearer cho toàn bộ controller
@ApiExtraModels(CreateUserDto, UpdateUserDto) // Model bổ sung nếu cần
@Controller('users')
export class UsersController {
  // ...
}
```

### 2. Decorator Cho Phương Thức (Method Level)

#### @ApiOperation - Mô tả operation
```typescript
@ApiOperation({
  summary: 'Tạo user mới', // Tóm tắt ngắn
  description: 'Tạo user mới với thông tin cơ bản', // Mô tả chi tiết
  operationId: 'createUser', // ID duy nhất cho operation
})
@Post()
createUser(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

#### @ApiBody - Body của request (POST/PUT/PATCH)
```typescript
@ApiBody({
  type: CreateUserDto, // DTO cho body
  description: 'Thông tin user cần tạo',
  examples: {
    'user-example': {
      summary: 'Ví dụ tạo user',
      value: {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123'
      }
    }
  }
})
@Post()
createUser(@Body() dto: CreateUserDto) { ... }
```

#### @ApiParam - Tham số trong URL (/:id)
```typescript
@ApiParam({
  name: 'id',
  type: String,
  description: 'ID của user',
  example: 'f4a5c5a0-8b2d-4c6a-9f7d-a1b2c3d4e5f6',
  format: 'uuid'
})
@Get(':id')
getUser(@Param('id') id: string) { ... }
```

#### @ApiQuery - Tham số query (?key=value)
```typescript
@ApiQuery({
  name: 'page',
  type: Number,
  description: 'Trang hiện tại',
  example: 1,
  required: false
})
@ApiQuery({
  name: 'limit',
  type: Number,
  description: 'Số item mỗi trang',
  example: 10,
  required: false
})
@ApiQuery({
  name: 'search',
  type: String,
  description: 'Từ khóa tìm kiếm',
  required: false
})
@Get()
getUsers(@Query() query: QueryUsersDto) { ... }
```

#### @ApiHeader - Header tùy chỉnh
```typescript
@ApiHeader({
  name: 'X-API-Key',
  description: 'API Key cho authentication',
  required: true,
  example: 'your-api-key-here'
})
@Post('special')
specialEndpoint() { ... }
```

### 3. Decorator Cho Response

#### @ApiOkResponse - Response thành công (200)
```typescript
@ApiOkResponse({
  description: 'User được tạo thành công',
  schema: {
    example: {
      success: true,
      message: 'User created successfully',
      data: {
        id: 'uuid',
        username: 'john_doe',
        email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }
    }
  }
})
@Post()
createUser(@Body() dto: CreateUserDto) { ... }
```

#### @ApiCreatedResponse - Response tạo mới (201)
```typescript
@ApiCreatedResponse({
  description: 'Resource created',
  schema: {
    example: {
      success: true,
      message: 'Created',
      data: { id: 'uuid', ... }
    }
  }
})
@Post()
createResource() { ... }
```

#### @ApiBadRequestResponse - Response lỗi 400
```typescript
@ApiBadRequestResponse({
  description: 'Dữ liệu không hợp lệ',
  schema: {
    example: {
      success: false,
      message: 'Validation failed',
      errors: [
        {
          field: 'email',
          message: 'Email is not valid'
        }
      ]
    }
  }
})
@Post()
createUser(@Body() dto: CreateUserDto) { ... }
```

#### @ApiUnauthorizedResponse - Response lỗi 401
```typescript
@ApiUnauthorizedResponse({
  description: 'Không có quyền truy cập',
  schema: {
    example: {
      success: false,
      message: 'Unauthorized',
      error: 'Invalid token'
    }
  }
})
@Get('protected')
protectedEndpoint() { ... }
```

#### @ApiNotFoundResponse - Response lỗi 404
```typescript
@ApiNotFoundResponse({
  description: 'Không tìm thấy resource',
  schema: {
    example: {
      success: false,
      message: 'User not found'
    }
  }
})
@Get(':id')
getUser(@Param('id') id: string) { ... }
```

#### @ApiInternalServerErrorResponse - Response lỗi 500
```typescript
@ApiInternalServerErrorResponse({
  description: 'Lỗi server nội bộ',
  schema: {
    example: {
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    }
  }
})
@Get()
getUsers() { ... }
```

## Decorator Cho DTO (Data Transfer Object)

### @ApiProperty - Thuộc tính bắt buộc
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Tên đăng nhập',
    example: 'john_doe',
    minLength: 3,
    maxLength: 50
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Email của user',
    example: 'john@example.com',
    format: 'email'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'password123',
    minLength: 6,
    format: 'password'
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
```

### @ApiPropertyOptional - Thuộc tính tùy chọn
```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Tên đầy đủ',
    example: 'John Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại',
    example: '+1234567890',
    required: false,
    pattern: '^\\+?[1-9]\\d{1,14}$'
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
```

### @ApiProperty với Array
```typescript
@ApiProperty({
  type: [String], // Array of strings
  description: 'Danh sách quyền',
  example: ['read', 'write', 'admin']
})
@IsArray()
@IsString({ each: true })
permissions: string[];
```

### @ApiProperty với Nested Object
```typescript
@ApiProperty({
  type: AddressDto, // Reference to another DTO
  description: 'Địa chỉ của user'
})
@ValidateNested()
@Type(() => AddressDto)
address: AddressDto;
```

### @ApiProperty với Enum
```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

@ApiProperty({
  enum: UserRole,
  description: 'Vai trò của user',
  example: UserRole.USER
})
@IsEnum(UserRole)
role: UserRole;
```

## Ví Dụ Schema Đầy Đủ

```typescript
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@ApiExtraModels(CreateUserDto, UpdateUserDto, QueryUsersDto)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo user mới',
    description: 'Tạo user mới với thông tin cơ bản. Yêu cầu quyền admin.'
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Thông tin user cần tạo'
  })
  @ApiCreatedResponse({
    description: 'User được tạo thành công',
    schema: {
      example: {
        success: true,
        message: 'User created successfully',
        data: {
          id: 'f4a5c5a0-8b2d-4c6a-9f7d-a1b2c3d4e5f6',
          username: 'john_doe',
          email: 'john@example.com',
          role: 'user',
          created_at: '2024-01-01T00:00:00Z'
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu không hợp lệ',
    schema: {
      example: {
        success: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'email',
            message: 'Email is not valid'
          }
        ]
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'Không có quyền truy cập',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
        error: 'Invalid token'
      }
    }
  })
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách users',
    description: 'Lấy danh sách users với phân trang và filter'
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'Trang hiện tại',
    example: 1,
    required: false
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Số item mỗi trang',
    example: 10,
    required: false
  })
  @ApiQuery({
    name: 'search',
    type: String,
    description: 'Từ khóa tìm kiếm theo username hoặc email',
    required: false
  })
  @ApiOkResponse({
    description: 'Danh sách users',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: {
          items: [
            {
              id: 'f4a5c5a0-8b2d-4c6a-9f7d-a1b2c3d4e5f6',
              username: 'john_doe',
              email: 'john@example.com',
              role: 'user',
              created_at: '2024-01-01T00:00:00Z'
            }
          ],
          meta: {
            total: 100,
            page: 1,
            pageSize: 10,
            totalPages: 10
          }
        }
      }
    }
  })
  getUsers(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin user theo ID',
    description: 'Lấy chi tiết thông tin của một user cụ thể'
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID của user',
    example: 'f4a5c5a0-8b2d-4c6a-9f7d-a1b2c3d4e5f6',
    format: 'uuid'
  })
  @ApiOkResponse({
    description: 'Thông tin user',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: {
          id: 'f4a5c5a0-8b2d-4c6a-9f7d-a1b2c3d4e5f6',
          username: 'john_doe',
          email: 'john@example.com',
          full_name: 'John Doe',
          role: 'user',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Không tìm thấy user',
    schema: {
      example: {
        success: false,
        message: 'User not found'
      }
    }
  })
  getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin user',
    description: 'Cập nhật thông tin của user. Chỉ cập nhật các trường được cung cấp.'
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID của user cần cập nhật',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Thông tin cần cập nhật'
  })
  @ApiOkResponse({
    description: 'User được cập nhật thành công',
    schema: {
      example: {
        success: true,
        message: 'User updated successfully',
        data: {
          id: 'f4a5c5a0-8b2d-4c6a-9f7d-a1b2c3d4e5f6',
          username: 'john_doe',
          email: 'john@example.com',
          full_name: 'John Doe Updated',
          updated_at: '2024-01-02T00:00:00Z'
        }
      }
    }
  })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa user',
    description: 'Xóa user khỏi hệ thống. Hành động này không thể hoàn tác.'
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID của user cần xóa',
    format: 'uuid'
  })
  @ApiOkResponse({
    description: 'User được xóa thành công',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully'
      }
    }
  })
  deleteUser(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
```

## Bảng Tóm Tắt Decorator

| Decorator | Sử dụng cho | Mô tả |
|-----------|-------------|-------|
| `@ApiTags` | Controller | Nhóm API trong Swagger UI |
| `@ApiBearerAuth` | Controller/Method | Xác thực Bearer token |
| `@ApiExtraModels` | Controller | Thêm model bổ sung vào schema |
| `@ApiOperation` | Method | Mô tả operation (summary, description) |
| `@ApiBody` | Method (POST/PUT/PATCH) | Mô tả request body |
| `@ApiParam` | Method | Tham số trong URL path |
| `@ApiQuery` | Method | Tham số query string |
| `@ApiHeader` | Method | Header tùy chỉnh |
| `@ApiOkResponse` | Method | Response thành công (200) |
| `@ApiCreatedResponse` | Method | Response tạo mới (201) |
| `@ApiBadRequestResponse` | Method | Response lỗi 400 |
| `@ApiUnauthorizedResponse` | Method | Response lỗi 401 |
| `@ApiNotFoundResponse` | Method | Response lỗi 404 |
| `@ApiInternalServerErrorResponse` | Method | Response lỗi 500 |
| `@ApiProperty` | DTO Property | Thuộc tính bắt buộc |
| `@ApiPropertyOptional` | DTO Property | Thuộc tính tùy chọn |

## Lưu Ý Quan Trọng

1. **Import đầy đủ**: Luôn import các decorator từ `@nestjs/swagger`
2. **Thứ tự decorator**: Thường đặt theo thứ tự: Operation → Params/Body → Responses
3. **Examples**: Sử dụng `schema.example` để cung cấp dữ liệu mẫu thực tế
4. **Consistency**: Đảm bảo format response nhất quán (success/message/data)
5. **Security**: Sử dụng `@ApiBearerAuth` cho các endpoint cần authentication
6. **Validation**: Kết hợp với `class-validator` để validation tự động
7. **Types**: Sử dụng TypeScript types chính xác cho các property

## Kiểm Tra và Debug

1. Chạy server: `npm run start:dev`
2. Truy cập: `http://localhost:8080/api-docs`
3. Kiểm tra:
   - Tất cả endpoints hiển thị
   - Schema DTO chính xác
   - Examples hoạt động
   - Authentication hoạt động
4. Sử dụng Swagger UI để test API trực tiếp</content>
<parameter name="filePath">e:\School\HK7\document\Project\TN-Clinic-Managerment-BE\SWAGGER_GUIDE.md