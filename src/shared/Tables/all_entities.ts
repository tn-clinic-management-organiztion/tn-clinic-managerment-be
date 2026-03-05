import { AnnotationProjectImage } from 'src/database/entities/ai/annotation_project_images.entity';
import { AnnotationProject } from 'src/database/entities/ai/annotation_projects.entity';
import { ImageAnnotation } from 'src/database/entities/ai/image_annotations.entity';
import { OrgRoom } from 'src/database/entities/auth/org_rooms.entity';
import { PatientProfile } from 'src/database/entities/auth/patient_profiles.entity';
import { RefSpecialty } from 'src/database/entities/auth/ref_specialties.entity';
import { StaffProfile } from 'src/database/entities/auth/staff_profiles.entity';
import { SysRole } from 'src/database/entities/auth/sys_roles.entity';
import { SysUser } from 'src/database/entities/auth/sys_users.entity';
import { MedicalEncounter } from 'src/database/entities/clinical/medical_encounters.entity';
import { RefIcd10 } from 'src/database/entities/clinical/ref_icd10.entity';
import { QueueCounter } from 'src/database/entities/queue/queue_counters.entity';
import { QueueTicket } from 'src/database/entities/queue/queue_tickets.entity';
import { RefServiceCategory } from 'src/database/entities/service/ref_service_categories.entity';
import { RefService } from 'src/database/entities/service/ref_services.entity';
import { ResultImage } from 'src/database/entities/service/result_images.entity';
import { RoomService } from 'src/database/entities/service/room_services.entity';
import { ServiceRequestItem } from 'src/database/entities/service/service_request_items.entity';
import { ServiceRequest } from 'src/database/entities/service/service_requests.entity';
import { ServiceResult } from 'src/database/entities/service/service_results.entity';
import { StaffRoomSchedule } from 'src/database/entities/schedule/staff_room_schedules.entity';
import { TicketServiceItem } from 'src/database/entities/service/ticket_service_items.entity';

const ALL_ENTITIES = [
  // Auth & Core
  SysUser,
  SysRole,
  StaffRoomSchedule,
  StaffProfile,
  PatientProfile,
  OrgRoom,
  RefSpecialty,

  // Clinical & Queue
  MedicalEncounter,
  QueueCounter,
  QueueTicket,
  RefIcd10,

  // Service (CLS)
  RefServiceCategory,
  RefService,
  RoomService,
  ServiceRequest,
  ServiceRequestItem,
  ServiceResult,
  ResultImage,
  TicketServiceItem,

  // Annotation
  AnnotationProject,
  AnnotationProjectImage,
  ImageAnnotation,

];

export { ALL_ENTITIES };
