import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { ServiceRequest } from 'src/database/entities/service/service_requests.entity';
import { ServiceRequestItem } from 'src/database/entities/service/service_request_items.entity';
import { ServiceResult } from 'src/database/entities/service/service_results.entity';
import { ResultImage } from 'src/database/entities/service/result_images.entity';

// Service Orders Module
import { ServiceRequestsController } from './controllers/service-requests.controller';
import { ServiceRequestsService } from './services/service-requests.service';

// Results Module
import { ResultsController } from './controllers/results.controller';
import { ResultsService } from './services/results.service';

// Shared Services
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary.module';
import { ServiceRequestItemsRepository } from 'src/modules/paraclinical/repositories/service-requests/service-request-items.repository';
import { ServiceRequestsRepository } from 'src/modules/paraclinical/repositories/service-requests/service-requests.repository';
import { QueueModule } from 'src/modules/queue/queue.module';
import { ClinicalModule } from 'src/modules/clinical/clinical.module';
import { IamModule } from 'src/modules/iam/iam.module';
import { SystemModule } from 'src/modules/system/system.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Service request entities
      ServiceRequest,
      ServiceRequestItem,

      // Result entities
      ServiceResult,
      ResultImage,
    ]),
    CloudinaryModule,
    QueueModule,
    ClinicalModule,
    IamModule,
    SystemModule,
  ],
  controllers: [ServiceRequestsController, ResultsController],
  providers: [
    ServiceRequestsService,
    ResultsService,
    ServiceRequestItemsRepository,
    ServiceRequestsRepository,
  ],
  exports: [
    ServiceRequestsService,
    ResultsService,
    ServiceRequestItemsRepository,
    ServiceRequestsRepository,
  ],
})
export class ParaclinicalModule {}
