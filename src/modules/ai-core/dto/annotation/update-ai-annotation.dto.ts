import { CreateAiAnnotationDto } from './create-ai-annotation.dto';
import { PartialType } from "@nestjs/mapped-types";

export class UpdateAiAnnotationDto extends PartialType(CreateAiAnnotationDto) {}