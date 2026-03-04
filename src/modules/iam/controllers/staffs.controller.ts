import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateStaffDto } from 'src/modules/iam/dto/staffs/create-staff.dto';
import { UpdateStaffDto } from 'src/modules/iam/dto/staffs/update-staff.dto';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { StaffService } from 'src/modules/iam/services/staff.service';

@Controller('iam/staff')
// @UseGuards(RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  // @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createStaff(
    @Body() createStaffDto: CreateStaffDto,
    // @CurrentUser('user_id') adminId: string,
  ) {
    // return this.staffService.createStaff(createStaffDto, adminId);
    return this.staffService.createStaff(createStaffDto);
  }

  @Put(':id')
  // @Roles('ADMIN')
  async updateStaff(
    @Param('id') staffId: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    return this.staffService.updateStaff(staffId, updateStaffDto);
  }

  @Get('all')
  // @Roles('ADMIN')
  async findAll() {
    return this.staffService.findAll();
  }

  @Get(':id')
  // @Roles('ADMIN', 'DOCTOR') // Admin và bác sĩ có thể xem
  async findOne(@Param('id') staffId: string) {
    return this.staffService.findOne(staffId);
  }
}
