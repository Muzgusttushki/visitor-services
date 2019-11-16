import { IsArray, IsDefined, IsString, ValidateNested } from 'class-validator';
import { DateTimeRange } from '../types/DateTimeRange';
import { Type } from 'class-transformer';

export class DashboardObject {
  @IsDefined()
  @IsString({each: true})
  @IsArray()
  sources: string[];
  @IsDefined()
  @ValidateNested()
  @Type(() => DateTimeRange)
  timeInterval: DateTimeRange;
}
