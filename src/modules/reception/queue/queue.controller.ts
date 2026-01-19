import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ParseEnumPipe,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  QueryTicketDto,
  AssignServicesDto,
} from './dto/queue.dto';
import {
  QueueSource,
  QueueStatus,
  QueueTicketType,
} from 'src/database/entities/reception/queue_tickets.entity';

@Controller('reception/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  createTicket(@Body() dto: CreateTicketDto) {
    return this.queueService.createTicket(dto);
  }

  @Get('tickets')
  findAll(@Query() query: QueryTicketDto) {
    return this.queueService.findAll(query);
  }

  @Get('tickets/today/:roomId')
  getTodayTickets(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query(
      'ticket_type',
      new ParseEnumPipe(QueueTicketType, { optional: true }),
    )
    ticketType?: QueueTicketType,
    @Query('source', new ParseEnumPipe(QueueSource, { optional: true }))
    source?: QueueSource,
  ) {
    return this.queueService.getTodayTicketsByRoom(roomId, ticketType, source);
  }

@Get('tickets/status/:status/room/:roomId')
getTicketsByStatus(
  @Param('status') status: string, // e.g. "WAITING" or "WAITING,CALLED"
  @Param('roomId', ParseIntPipe) roomId: number,
  @Query('ticket_type', new ParseEnumPipe(QueueTicketType, { optional: true }))
  ticketType?: QueueTicketType,
  @Query('source', new ParseEnumPipe(QueueSource, { optional: true }))
  source?: QueueSource,
) {
  const statuses = status
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowed = new Set(Object.values(QueueStatus));
  const invalid = statuses.filter((s) => !allowed.has(s as QueueStatus));
  if (invalid.length > 0) {
    throw new BadRequestException(`Invalid status: ${invalid.join(', ')}`);
  }
  return this.queueService.getTicketsByStatus(status, roomId, ticketType, source);
}

  @Get('tickets/:id')
  findOne(@Param('id') id: string) {
    return this.queueService.findOne(id);
  }

  @Post('tickets/:id/call')
  @HttpCode(HttpStatus.OK)
  callSpecific(@Param('id') id: string) {
    return this.queueService.callSpecific(id);
  }

  @Post('tickets/:id/start')
  @HttpCode(HttpStatus.OK)
  startService(@Param('id') id: string) {
    return this.queueService.startService(id);
  }

  @Post('tickets/:id/complete')
  @HttpCode(HttpStatus.OK)
  completeTicket(@Param('id') id: string) {
    return this.queueService.completeTicket(id);
  }

  @Post('tickets/:id/skip')
  @HttpCode(HttpStatus.OK)
  skipTicket(@Param('id') id: string) {
    return this.queueService.skipTicket(id);
  }

  @Post('tickets/:id/assign-services')
  @HttpCode(HttpStatus.OK)
  assignServices(@Param('id') id: string, @Body() dto: AssignServicesDto) {
    return this.queueService.assignServices(id, dto);
  }

  @Patch('tickets/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.queueService.update(id, dto);
  }

  @Post('counters/reset')
  @HttpCode(HttpStatus.OK)
  resetCounters() {
    return this.queueService.resetCounters();
  }

  @Get('/counters/last-number')
  getLastNumberOfRoomToDay(@Param('id') id: number) {
    return this.queueService.getLastNumberOfRoomToday(id);
  }
}
