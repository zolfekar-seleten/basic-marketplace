import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

function numberWhenProvided(value: unknown): unknown {
  return value === undefined || value === null ? value : Number(value);
}

function booleanWhenProvided(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class UpdateProductDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  description?: string | null;

  @Transform(({ value }) => numberWhenProvided(value))
  @Transform(({ value }) => booleanWhenProvided(value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9999999999.99)
  price?: number;

  @Transform(({ value }) => numberWhenProvided(value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(0)
  stock?: number;

  @Transform(({ value }) => numberWhenProvided(value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @Transform(({ value }) => booleanWhenProvided(value))
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
