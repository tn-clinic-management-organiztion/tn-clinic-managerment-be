import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrgRoom } from 'src/database/entities/auth/org_rooms.entity';
import { RefIcd10 } from 'src/database/entities/clinical/ref_icd10.entity';
import { Icd10Controller } from 'src/modules/system/controllers/icd10.controller';
import { OrgRoomsService } from 'src/modules/system/services/org-room.service';
import { Icd10Repository } from 'src/modules/system/repositories/icd10.repository';
import { Icd10Service } from 'src/modules/system/services/icd10.service';
import { OrgRoomsController } from 'src/modules/system/controllers/org-room.controller';
import { RefServiceCategory } from 'src/database/entities/service/ref_service_categories.entity';
import { RefService } from 'src/database/entities/service/ref_services.entity';
import { ServicesService } from 'src/modules/system/services-dv/services.service';
import { ServicesController } from 'src/modules/system/services-dv/services.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrgRoom,
      RefIcd10,
      RefService,
      RefServiceCategory,
    ]),
  ],
  controllers: [OrgRoomsController, Icd10Controller, ServicesController],
  providers: [OrgRoomsService, Icd10Service, Icd10Repository, ServicesService],
  exports: [OrgRoomsService, Icd10Service, Icd10Repository, ServicesService],
})
export class SystemModule {}
