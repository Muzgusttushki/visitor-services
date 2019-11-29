import {IsDefined, IsString, IsNumber, IsBoolean} from "class-validator";

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
    @IsBoolean()
    checked: boolean

    @IsDefined()
    @IsNumber()
    offset: number
}
