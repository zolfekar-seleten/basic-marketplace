import { IsString, MinLength } from 'class-validator';

import { MaxBcryptPasswordBytes } from './max-bcrypt-password-bytes.decorator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxBcryptPasswordBytes(72)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxBcryptPasswordBytes(72)
  newPassword: string;
}
