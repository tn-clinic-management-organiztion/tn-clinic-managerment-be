import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteAiAnnotationDto {
    @IsUUID()
    @IsNotEmpty()
    image_id: string;
}