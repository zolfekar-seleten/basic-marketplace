import { Transform } from 'class-transformer';
import {
  IsIn,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

function numberWhenProvided(value: unknown): unknown {
  return value === undefined || value === null ? value : Number(value);
}

export class ListProductsDto {
  @Transform(({ value }) => numberWhenProvided(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Transform(({ value }) => numberWhenProvided(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @Transform(({ value }) => numberWhenProvided(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @Transform(({ value }) => numberWhenProvided(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  supplierId?: number;

  @Transform(({ value }) => numberWhenProvided(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @Transform(({ value }) => numberWhenProvided(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  maxPrice?: number;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['price', 'name', 'createdAt'])
  sortBy?: 'price' | 'name' | 'createdAt';

  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
