import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({
    example: 50000,
    description: 'Amount to add (positive) or subtract (negative) from goal progress (in cents)'
  })
  @IsNotEmpty()
  @IsInt()
  amount: number;
}

