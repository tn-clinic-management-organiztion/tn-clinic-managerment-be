import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class StartConsultationDto {
  @IsNotEmpty()
  @IsUUID()
  doctor_id: string;
}

export class CompleteConsultationDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  final_icd_code: string;

  @IsNotEmpty()
  @IsString()
  doctor_conclusion: string;
}