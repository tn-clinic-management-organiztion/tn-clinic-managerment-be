import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/services/create-service.dto';
import { UpdateServiceDto } from './dto/services/update-service.dto';
import { QueryServiceDto } from './dto/services/query-service.dto';
import { CreateCategoryDto } from './dto/categories/create-category.dto';
import { UpdateCategoryDto } from './dto/categories/update-category.dto';
import { QueryCategoryDto } from './dto/categories/query-category.dto';
import { LinkRoomServiceDto } from './dto/services/link-room-service.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ==================== CATEGORIES ====================
  @Post('categories')
  @ApiOperation({ summary: 'Create service category' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.servicesService.createCategory(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with pagination' })
  findAllCategories(@Query() query: QueryCategoryDto) {
    return this.servicesService.findAllCategories(query);
  }

  @Get('categories/tree')
  @ApiOperation({ summary: 'Get category tree structure' })
  getCategoryTree() {
    return this.servicesService.getCategoryTree();
  }

  // ==================== SERVICES ====================
  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  createService(@Body() dto: CreateServiceDto) {
    return this.servicesService.createService(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services with pagination' })
  findAllServices(@Query() query: QueryServiceDto) {
    return this.servicesService.findAllServices(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  findOneService(@Param('id') id: string) {
    return this.servicesService.findOneService(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service' })
  updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.updateService(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  removeService(@Param('id') id: string) {
    return this.servicesService.removeService(+id);
  }

  // ==================== CATEGORIES ====================
  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  findOneCategory(@Param('id') id: string) {
    return this.servicesService.findOneCategory(+id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.servicesService.updateCategory(+id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  removeCategory(@Param('id') id: string) {
    return this.servicesService.removeCategory(+id);
  }

  // ==================== ROOM-SERVICE LINKS ====================
  @Post('room-service/link-room')
  @ApiOperation({ summary: 'Link service to room' })
  linkRoomService(@Body() dto: LinkRoomServiceDto) {
    return this.servicesService.linkRoomService(dto);
  }

  @Delete('room-service/rooms/:roomId/services/:serviceId')
  @ApiOperation({ summary: 'Unlink service from room' })
  unlinkRoomService(
    @Param('roomId') roomId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.servicesService.unlinkRoomService(+roomId, +serviceId);
  }

  @Get('room-service/rooms/:roomId')
  @ApiOperation({ summary: 'Get all services for a room' })
  getRoomServices(@Param('roomId') roomId: string) {
    return this.servicesService.getRoomServices(+roomId);
  }

  @Get('room-service/:id/rooms')
  @ApiOperation({ summary: 'Get all rooms providing a service' })
  getServiceRooms(@Param('id') id: string) {
    return this.servicesService.getServiceRooms(+id);
  }

  @Get('encounters/:encounterId/assigned-services')
  @ApiOperation({
    summary:
      'Get assigned services for an encounter (from SERVICE queue tickets)',
  })
  getAssignedServicesByEncounter(@Param('encounterId') encounterId: string) {
    return this.servicesService.getAssignedServicesByEncounter(encounterId);
  }

  //   {
  //   data: [
  //     {
  //       room_id,
  //       room_name,
  //       status,         
  //       display_number, 
  //       services: [{ service_id, service_name, category_name, unit_price, ... }]
  //     }
  //   ],
  //   meta: { totalRooms, totalServices }
  // }
}
