import { IsDefined, IsNotEmpty, IsInt, ArrayMinSize, ArrayMaxSize } from "class-validator/decorator/decorators"
import { Transform } from "class-transformer/decorators"

export class PrepareCustomerFiltersDTO {
    @IsDefined()
    @Transform((query: String[]) => query.map(Number))
    @IsNotEmpty({ each: true })
    @IsInt({ each: true })
    @ArrayMinSize(3)
    @ArrayMaxSize(3)
    pdd: number[]


    @IsDefined()
    @Transform((query: String[]) => query.map(Number))
    @IsNotEmpty({ each: true })
    @IsInt({ each: true })
    @ArrayMinSize(3)
    @ArrayMaxSize(3)
    sdd: number[]
}