import { IsOptional, IsDateString } from 'class-validator';

export class DateRangeFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
