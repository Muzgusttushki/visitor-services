import {IsDefined, IsNotEmpty, IsNumber, IsPositive, IsString, Max, Min} from "class-validator";

export  class GetStepsUserDTO {
    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsDefined()
    @IsPositive()
    @Min(0)
    @IsNumber()
    offset: number;

    @IsPositive()
    @IsDefined()
    @IsNumber()
    @Max(40)
    @Min(10)
    views: number;
}
