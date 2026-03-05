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
  BadRequestException,
} from '@nestjs/common';
import { QueuesService } from '../../queue/services/queue.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  QueryTicketDto,
} from '../../queue/dto/queue.dto';
import {
  QueueSource,
  QueueStatus,
  QueueTicketType,
} from 'src/database/entities/queue/queue_tickets.entity';
import { ApiOperation } from '@nestjs/swagger';

@Controller('queue')
export class QueueController {
  constructor(private readonly queuesService: QueuesService) {}

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  createTicket(@Body() dto: CreateTicketDto) {
    return this.queuesService.createTicket(dto);
  }

  @Get('tickets')
  findAll(@Query() query: QueryTicketDto) {
    return this.queuesService.findAllTickets(query);
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
    return this.queuesService.getTodayTicketsByRoom(roomId, ticketType, source);
  }

  @Get('tickets/:ticketId/items')
  @ApiOperation({ summary: 'Get service request items for a ticket' })
  async getTicketItems(@Param('ticketId') ticketId: string) {
    return this.queuesService.getItemsByTicketId(ticketId);
  }

  @Get('tickets/status/:status/room/:roomId')
  getTicketsByStatus(
    @Param('status') status: string, // e.g. "WAITING" or "WAITING,CALLED"
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query(
      'ticket_type',
      new ParseEnumPipe(QueueTicketType, { optional: true }),
    )
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
    return this.queuesService.getTicketsByStatus(
      status,
      roomId,
      ticketType,
      source,
    );
  }

  @Get('tickets/:id')
  findOne(@Param('id') id: string) {
    return this.queuesService.getTicketById(id);
  }

  @Post('tickets/:id/call')
  @HttpCode(HttpStatus.OK)
  callSpecific(@Param('id') id: string) {
    return this.queuesService.callSpecific(id);
  }

  @Post('tickets/:id/start')
  @HttpCode(HttpStatus.OK)
  startService(@Param('id') id: string) {
    return this.queuesService.startService(id);
  }

  @Post('tickets/:id/complete')
  @HttpCode(HttpStatus.OK)
  completeTicket(@Param('id') id: string) {
    return this.queuesService.completeTicket(id);
  }

  @Post('tickets/:id/skip')
  @HttpCode(HttpStatus.OK)
  skipTicket(@Param('id') id: string) {
    return this.queuesService.skipTicket(id);
  }

  @Patch('tickets/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.queuesService.update(id, dto);
  }

  @Post('counters/reset')
  @HttpCode(HttpStatus.OK)
  resetCounters() {
    return this.queuesService.cleanupOldCounters();
  }

  @Get('/counters/last-number')
  getLastNumberOfRoomToDay(@Param('id') id: number) {
    return this.queuesService.getLastNumberOfRoomToday(id);
  }
}
