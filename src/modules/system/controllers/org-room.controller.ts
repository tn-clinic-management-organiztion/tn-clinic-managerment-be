import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AssignServicesToRoomDto, CreateOrgRoomDto, QueryOrgRoomDto, UpdateOrgRoomDto } from 'src/modules/system/dto/org-room/org-room.dto';
import { OrgRoomsService } from 'src/modules/system/services/org-room.service';


@Controller('system/rooms')
export class OrgRoomsController {
  constructor(private readonly orgRoomsService: OrgRoomsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOrgRoomDto) {
    return this.orgRoomsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryOrgRoomDto) {
    return this.orgRoomsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orgRoomsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrgRoomDto,
  ) {
    return this.orgRoomsService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.orgRoomsService.toggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orgRoomsService.remove(id);
  }

  // ==================== SERVICES MANAGEMENT ====================

  @Post(':id/services')
  @HttpCode(HttpStatus.OK)
  assignServices(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignServicesToRoomDto,
  ) {
    return this.orgRoomsService.assignServices(id, dto);
  }

  @Get(':id/services')
  getRoomServices(@Param('id', ParseIntPipe) id: number) {
    return this.orgRoomsService.getRoomServices(id);
  }

  @Delete(':roomId/services/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeService(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ) {
    return this.orgRoomsService.removeService(roomId, serviceId);
  }

  @Get('by-service/:serviceId')
  findRoomsByService(@Param('serviceId', ParseIntPipe) serviceId: number) {
    return this.orgRoomsService.findRoomsByService(serviceId);
  }
}
