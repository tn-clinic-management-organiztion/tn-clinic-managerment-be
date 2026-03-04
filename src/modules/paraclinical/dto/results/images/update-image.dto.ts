import { PartialType } from '@nestjs/mapped-types';
import { CreateResultImageDto } from './create-image.dto';

export class UpdateResultImageDto extends PartialType(CreateResultImageDto) {}