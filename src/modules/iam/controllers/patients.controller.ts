import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/role.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreatePatientDto } from 'src/modules/iam/dto/patients/create-patient.dto';
import { UpdatePatientDto } from 'src/modules/iam/dto/patients/update-patient.dto';
import { PatientSearchDto } from 'src/modules/iam/dto/patients/patient-search.dto';
import { PatientsService } from 'src/modules/iam/services/patients.service';

@ApiTags('Patients')
@ApiBearerAuth('access-token')
@Controller('iam/patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo mới hồ sơ bệnh nhân' })
  @ApiBody({ type: CreatePatientDto })
  @ApiOkResponse({
    description: 'Tạo bệnh nhân thành công',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: {
          patient_id: '8d2b7c4e-1234-4b5c-9a6f-1a2b3c4d5e6f',
          full_name: 'Nguyễn Văn A',
          phone: '0912345678',
          dob: '1990-01-01',
          gender: 'NAM',
        },
      },
    },
  })
  async create(
    @Body() createPatientDto: CreatePatientDto,
    // @CurrentUser('user_id') staffId: string,
  ) {
    return this.patientsService.create(createPatientDto);
  }

  @Put(':id')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ bệnh nhân' })
  @ApiBody({ type: UpdatePatientDto })
  @ApiOkResponse({
    description: 'Cập nhật bệnh nhân thành công',
  })
  async update(
    @Param('id') patientId: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(patientId, updatePatientDto);
  }

  @Get('search')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tìm kiếm bệnh nhân theo số điện thoại / tên / CCCD',
  })
  @ApiOkResponse({
    description: 'Danh sách bệnh nhân khớp điều kiện tìm kiếm',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: [
          {
            patient_id: '8d2b7c4e-1234-4b5c-9a6f-1a2b3c4d5e6f',
            full_name: 'Nguyễn Văn A',
            phone: '0912345678',
            dob: '1990-01-01',
            gender: 'NAM',
          },
        ],
      },
    },
  })
  async search(@Query() searchDto: PatientSearchDto) {
    return this.patientsService.search(searchDto);
  }

  @Get('phone/:phone')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin bệnh nhân theo số điện thoại' })
  async getByPhone(@Param('phone') phone: string) {
    return this.patientsService.getByPhone(phone);
  }

  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết hồ sơ bệnh nhân theo ID' })
  async getById(@Param('id') patientId: string) {
    return this.patientsService.getById(patientId);
  }
}
