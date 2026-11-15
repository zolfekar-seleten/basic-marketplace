import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

function toNumber(value: unknown): unknown {
  return value === undefined || value === null ? value : Number(value);
}

export class UpdateCartItemDto {
  @Transform(({ value }) => toNumber(value))
  @IsInt()
  @Min(1)
  quantity: number;
}
