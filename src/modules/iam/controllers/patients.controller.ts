import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/role.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreatePatientDto } from 'src/modules/iam/dto/patients/create-patient.dto';
import { UpdatePatientDto } from 'src/modules/iam/dto/patients/update-patient.dto';
import { PatientSearchDto } from 'src/modules/iam/dto/patients/patient-search.dto';
import { PatientsService } from 'src/modules/iam/services/patients.service';

@Controller('iam/patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPatientDto: CreatePatientDto,
    // @CurrentUser('user_id') staffId: string,
  ) {
    return this.patientsService.create(createPatientDto);
  }

  @Put(':id')
  @Roles('ADMIN', 'RECEPTIONIST')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') patientId: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(patientId, updatePatientDto);
  }

  @Get('search')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST')
  @HttpCode(HttpStatus.OK)
  async search(@Query() searchDto: PatientSearchDto) {
    return this.patientsService.search(searchDto);
  }

  @Get('phone/:phone')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST')
  @HttpCode(HttpStatus.OK)
  async getByPhone(@Param('phone') phone: string) {
    return this.patientsService.getByPhone(phone);
  }

  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PHARMACIST')
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id') patientId: string) {
    return this.patientsService.getById(patientId);
  }
}