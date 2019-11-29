import {IsString} from "class-validator";

export class GetStepDetailDTO {
    @IsString()
    address: string;
}
