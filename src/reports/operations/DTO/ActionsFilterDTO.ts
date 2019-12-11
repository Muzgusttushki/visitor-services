import { IsDefined, IsString, IsNumber, IsPositive, Min, Max, IsBoolean, MinLength, ArrayMinSize } from "class-validator"

export class ActionsFilterDTO {
    @ArrayMinSize(1)
    @IsString({ each: true })
    events: string[]

    @ArrayMinSize(1)
    @IsString({ each: true })
    statuses: string[]

    @ArrayMinSize(1)
    @IsString({ each: true })
    cities: string[]

    @ArrayMinSize(1)
    @IsString({ each: true })
    browsers: string[]

    @ArrayMinSize(1)
    @IsString({ each: true })
    oses: string[]

    @IsBoolean()
    sheets: boolean

    @IsPositive()
    @IsNumber()
    page: number

    @Min(10)
    @Max(100)
    @IsPositive()
    @IsNumber()
    views: number;
}