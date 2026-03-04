import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EncountersService } from '../services/encounters.service';

import { EncounterStatus } from 'src/database/entities/clinical/medical_encounters.entity';
import { CreateEncounterDto } from 'src/modules/clinical/dto/encounters/create-encounter.dto';
import { QueryEncounterDto } from 'src/modules/clinical/dto/encounters/query-encounter.dto';
import { CompleteConsultationDto, StartConsultationDto } from 'src/modules/clinical/dto/encounters/action-consultation.dto';
import { UpdateEncounterDto } from 'src/modules/clinical/dto/encounters/update-encounter.dto';


@Controller('clinical/encounters')
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEncounterDto) {
    return this.encountersService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryEncounterDto) {
    return this.encountersService.findAllEncounters(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.encountersService.findDetailEncounter(id);
  }

  @Get('patient/:patientId/history')
  getPatientHistory(@Param('patientId') patientId: string) {
    return this.encountersService.getPatientEncounterHistory(patientId);
  }

  @Post(':id/start-consultation')
  @HttpCode(HttpStatus.OK)
  startConsultation(
    @Param('id') id: string,
    @Body() dto: StartConsultationDto,
  ) {
    return this.encountersService.startConsultation(id, dto);
  }

  @Post(':id/complete-consultation')
  @HttpCode(HttpStatus.OK)
  completeConsultation(
    @Param('id') id: string,
    @Body() dto: CompleteConsultationDto,
  ) {
    return this.encountersService.completeConsultation(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEncounterDto) {
    return this.encountersService.update(id, dto);
  }

  @Patch(':id/status/:status')
  updateStatus(
    @Param('id') id: string,
    @Param('status') status: EncounterStatus,
  ) {
    return this.encountersService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.encountersService.remove(id);
  }
}
