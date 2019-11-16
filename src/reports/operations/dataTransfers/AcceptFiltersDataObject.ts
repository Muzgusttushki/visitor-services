import { IsDefined, IsString, IsNumber } from "class-validator";

export class AcceptFiltersDataObject {
    @IsDefined()
    @IsString({ each: true })
    events: string[]

    @IsDefined()
    @IsString({ each: true })
    statuses: string[]

    @IsDefined()
    @IsString({ each: true })
    sources: string[]

    @IsDefined()
    @IsString({ each: true })
    cities: string[]

    @IsDefined()
    @IsString({ each: true })
    browsers: string[]

    @IsDefined()
    @IsString({ each: true })
    oses: string[]

    @IsDefined()
    @IsNumber()
    offset: number
}