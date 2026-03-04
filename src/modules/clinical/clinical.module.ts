import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalEncounter } from 'src/database/entities/clinical/medical_encounters.entity';
import { EncountersController } from 'src/modules/clinical/controllers/encounters.controller';
import { EncountersService } from 'src/modules/clinical/services/encounters.service';
import { IamModule } from 'src/modules/iam/iam.module';
import { EncountersRepository } from 'src/modules/clinical/repositories/encounters.repository';
import { SystemModule } from 'src/modules/system/system.module';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalEncounter]), IamModule, SystemModule],
  controllers: [EncountersController],
  providers: [
    EncountersService,
    EncountersRepository,

  ],
  exports: [
    EncountersService,
    EncountersRepository,
  ],
})
export class ClinicalModule {}
