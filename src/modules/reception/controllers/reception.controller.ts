import { ReceptionService } from 'src/modules/reception/services/reception.service';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateInitialConsultantDto } from 'src/modules/reception/dto/reception.dto';

@Controller('reception')
export class ReceptionController {
  constructor(private readonly receptionService: ReceptionService) {}

  @Post('initial-consultant')
  @HttpCode(HttpStatus.CREATED)
  createInitialConsultant(@Body() dto: CreateInitialConsultantDto) {
    return this.receptionService.createInitialConsultation(dto);
  }
}
