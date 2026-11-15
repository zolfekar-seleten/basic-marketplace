import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

function numberWhenProvided(value: unknown): unknown {
  return value === undefined || value === null ? value : Number(value);
}

export class ListOrdersDto {
  @Transform(({ value }) => numberWhenProvided(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Transform(({ value }) => numberWhenProvided(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsIn(['pending', 'completed'])
  status?: 'pending' | 'completed';

  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort: 'newest' | 'oldest' = 'newest';
}
