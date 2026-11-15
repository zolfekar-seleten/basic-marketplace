import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['pending', 'completed'])
  status: 'pending' | 'completed';
}
