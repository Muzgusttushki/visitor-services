import { IsArray, IsDefined, IsNumber, IsString, ValidateNested } from 'class-validator';
import { DateTimeRange } from '../types/DateTimeRange';
import { Type } from 'class-transformer';

export class BuyersArrayObject {
  @IsArray()
  @IsString({ each: true })
  sources: string[];

  @ValidateNested()
  @Type(() => DateTimeRange)
  timeInterval: DateTimeRange;

  @IsDefined()
  @IsNumber()
  offset: number
}
