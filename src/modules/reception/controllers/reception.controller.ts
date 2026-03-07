import { ReceptionService } from 'src/modules/reception/services/reception.service';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateInitialConsultantDto } from 'src/modules/reception/dto/reception.dto';

@ApiTags('Reception')
@ApiBearerAuth('access-token')
@Controller('reception')
export class ReceptionController {
  constructor(private readonly receptionService: ReceptionService) {}

  @Post('initial-consultant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Tiếp nhận ban đầu: tạo bệnh nhân (nếu chưa có), encounter và ticket',
  })
  @ApiBody({ type: CreateInitialConsultantDto })
  @ApiOkResponse({
    description:
      'Tiếp nhận thành công, trả về thông tin bệnh nhân, encounter và ticket',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: {
          patient: {
            patient_id: '8d2b7c4e-1234-4b5c-9a6f-1a2b3c4d5e6f',
            full_name: 'Nguyễn Văn A',
          },
          encounter: {
            encounter_id: 'encounter-uuid',
            current_status: 'REGISTERED',
          },
          ticket: {
            ticket_id: 'ticket-uuid',
            display_number: 'A001',
            room_id: 101,
          },
        },
      },
    },
  })
  createInitialConsultant(@Body() dto: CreateInitialConsultantDto) {
    return this.receptionService.createInitialConsultation(dto);
  }
}
