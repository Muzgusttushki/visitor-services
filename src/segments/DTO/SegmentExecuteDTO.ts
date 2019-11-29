import {IsBoolean, IsDefined, IsString} from "class-validator";

export class SegmentExecuteDTO {
    @IsDefined()
    @IsString()
    command: string;

    @IsDefined()
    @IsString()
    segment: string;

    @IsBoolean()
    automation: boolean
}
