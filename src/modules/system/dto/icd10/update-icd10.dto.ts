import { PartialType } from '@nestjs/mapped-types';
import { CreateIcd10Dto } from './create-icd10.dto';

// Sửa lại như sau (Bỏ OmitType):
export class UpdateIcd10Dto extends PartialType(CreateIcd10Dto) {}