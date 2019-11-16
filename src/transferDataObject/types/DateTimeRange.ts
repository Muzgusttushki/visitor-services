import { IsDateString, IsDefined } from 'class-validator';

export class DateTimeRange {
  @IsDefined()
  @IsDateString()
  start: string;
  @IsDefined()
  @IsDateString()
  end: string;
}
