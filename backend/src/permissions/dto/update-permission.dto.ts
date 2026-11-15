import { Transform } from 'class-transformer';
import { IsDefined, IsString, MaxLength } from 'class-validator';

export class UpdatePermissionDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsDefined()
  @IsString()
  @MaxLength(255)
  description: string;
}
