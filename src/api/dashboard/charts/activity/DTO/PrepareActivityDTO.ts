import { IsDefined, IsNotEmpty, IsInt, ArrayMinSize, ArrayMaxSize } from "class-validator";
import { Transform } from "class-transformer";

export class PrepareActivityDTO {
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