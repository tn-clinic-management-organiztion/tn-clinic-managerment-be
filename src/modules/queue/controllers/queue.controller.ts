import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('Queue')
@ApiBearerAuth('access-token')
@Controller('queue')
export class QueueController {
  constructor(private readonly queuesService: QueuesService) {}

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo ticket mới cho queue' })
  @ApiBody({ type: CreateTicketDto })
  @ApiOkResponse({
    description: 'Ticket vừa tạo',
    schema: { example: { success: true, message: 'OK', data: { ticket_id: '...', display_number: 'A001' } } },
  })
  createTicket(@Body() dto: CreateTicketDto) {
    return this.queuesService.createTicket(dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Lấy danh sách ticket với filter & pagination' })
  @ApiQuery({ type: QueryTicketDto })
  @ApiOkResponse({
    description: 'Danh sách tickets có pagination',
    schema: { example: { success: true, message: 'OK', data: { items: [], meta: { total:0,page:1,pageSize:10 } } } },
  })
  findAll(@Query() query: QueryTicketDto) {
    return this.queuesService.findAllTickets(query);
  }

  @Get('tickets/today/:roomId')
  @ApiOperation({
    summary: 'Lấy danh sách ticket hôm nay theo phòng và loại ticket',
  })
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
  @ApiOperation({ summary: 'Lấy danh sách service request item cho ticket' })
  async getTicketItems(@Param('ticketId') ticketId: string) {
    return this.queuesService.getItemsByTicketId(ticketId);
  }

  @Get('tickets/status/:status/room/:roomId')
  @ApiOperation({
    summary:
      'Lấy danh sách ticket theo nhiều trạng thái (WAITING,CALLED,...) và phòng',
  })
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
  @ApiOperation({ summary: 'Lấy chi tiết ticket theo ID' })
  findOne(@Param('id') id: string) {
    return this.queuesService.getTicketById(id);
  }

  @Post('tickets/:id/call')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gọi một ticket cụ thể' })
  callSpecific(@Param('id') id: string) {
    return this.queuesService.callSpecific(id);
  }

  @Post('tickets/:id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bắt đầu phục vụ ticket' })
  startService(@Param('id') id: string) {
    return this.queuesService.startService(id);
  }

  @Post('tickets/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hoàn thành ticket' })
  completeTicket(@Param('id') id: string) {
    return this.queuesService.completeTicket(id);
  }

  @Post('tickets/:id/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bỏ qua ticket (SKIPPED)' })
  skipTicket(@Param('id') id: string) {
    return this.queuesService.skipTicket(id);
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin ticket' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.queuesService.update(id, dto);
  }

  @Post('counters/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset counter của tất cả phòng (cron thủ công)' })
  resetCounters() {
    return this.queuesService.cleanupOldCounters();
  }

  @Get('/counters/last-number')
  @ApiOperation({
    summary: 'Lấy số thứ tự cuối cùng của một phòng trong ngày hiện tại',
  })
  getLastNumberOfRoomToDay(@Param('id') id: number) {
    return this.queuesService.getLastNumberOfRoomToday(id);
  }
}
