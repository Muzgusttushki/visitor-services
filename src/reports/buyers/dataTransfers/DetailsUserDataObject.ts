import { IsDefined, IsNumber, IsString } from "class-validator";

export class DetailsUserDataObject {
    @IsDefined()
    @IsString()
    phone: string
}
