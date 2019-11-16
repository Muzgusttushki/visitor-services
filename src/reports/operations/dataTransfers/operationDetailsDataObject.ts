import { IsDefined, ValidateNested, IsString } from "class-validator";
import { ObjectID } from "bson";
import { Type } from 'class-transformer';

export class OperationDetailsDataObject {
    @IsDefined()
    @IsString()
    offset: string
}