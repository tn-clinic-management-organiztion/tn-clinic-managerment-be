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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ServiceRequestsService } from '../services/service-requests.service';
import { CreateServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/create-service-request.dto';
import { QueryServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/query-service-request.dto';
import { UpdateServiceRequestDto } from 'src/modules/paraclinical/dto/service-requests/update-service-request.dto';
import { UpdateRequestItemDto } from 'src/modules/paraclinical/dto/service-requests/update-request-item.dto';

@ApiTags('Service Requests')
@Controller('paraclinical/service-requests')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create service request with items' })
  @ApiBody({ type: CreateServiceRequestDto })
  @ApiOkResponse({
    description: 'Created request object',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: {
          id: 'uuid',
          encounter_id: 'uuid',
          requesting_doctor_id: 'uuid',
          notes: null,
          items: [{ service_id: 123 }],
        },
      },
    },
  })
  createRequest(@Body() dto: CreateServiceRequestDto) {
    return this.serviceRequestsService.createRequest(dto);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all service requests with pagination' })
  @ApiQuery({ type: QueryServiceRequestDto })
  @ApiOkResponse({
    description: 'Paged list of requests',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: {
          items: [
            { id: 'uuid', encounter_id: 'uuid', requesting_doctor_id: 'uuid', items: [] },
          ],
          meta: { total: 1, page: 1, pageSize: 10 },
        },
      },
    },
  })
  findAllRequests(@Query() query: QueryServiceRequestDto) {
    return this.serviceRequestsService.findAllRequests(query);
  }

  // @Get('pending')
  // @ApiOperation({ summary: 'Get pending items for room' })
  // getPendingItems(@Query('roomId') roomId?: string) {
  //   return this.serviceRequestsService.getPendingItems(
  //     roomId ? +roomId : undefined,
  //   );
  // }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get service request by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the service request' })
  @ApiOkResponse({
    description: 'Single request',
    schema: {
      example: {
        success: true,
        message: 'OK',
        data: { id: 'uuid', encounter_id: 'uuid', items: [] },
      },
    },
  })
  findOneRequest(@Param('id') id: string) {
    return this.serviceRequestsService.findOneRequest(id);
  }

  @Get(':id/with-items')
  @ApiOperation({ summary: 'Get service request with all items' })
  getRequestWithItems(@Param('id') id: string) {
    return this.serviceRequestsService.getRequestWithItems(id);
  }

  @Get('encounter/:encounterId/items')
  @ApiOperation({ summary: 'Get all items for an encounter' })
  getRequestItemsByEncounter(@Param('encounterId') encounterId: string) {
    return this.serviceRequestsService.getRequestItemsByEncounter(encounterId);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update service request' })
  @ApiParam({ name: 'id', description: 'UUID of request to update' })
  @ApiBody({ type: UpdateServiceRequestDto })
  @ApiOkResponse({
    description: 'Updated object',
    schema: { example: { success: true, message: 'OK', data: { /* updated fields */ } } },
  })
  updateRequest(@Param('id') id: string, @Body() dto: UpdateServiceRequestDto) {
    return this.serviceRequestsService.updateRequest(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft delete service request' })
  @ApiParam({ name: 'id', description: 'UUID of request to delete' })
  @ApiOkResponse({
    description: 'Deletion success',
    schema: { example: { success: true, message: 'OK', data: true } },
  })
  removeRequest(@Param('id') id: string) {
    return this.serviceRequestsService.removeRequest(id);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update request item status' })
  updateRequestItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateRequestItemDto,
  ) {
    return this.serviceRequestsService.updateRequestItem(itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Delete request item' })
  removeRequestItem(@Param('itemId') itemId: string) {
    return this.serviceRequestsService.removeRequestItem(itemId);
  }

  @Get('encounter/:encounterId/cls-items')
  @ApiOperation({
    summary: 'Get CLS items by encounter (exclude consultation)',
  })
  async getClsItemsByEncounter(@Param('encounterId') encounterId: string) {
    return this.serviceRequestsService.getClsItemsByEncounter(encounterId);
  }
}
