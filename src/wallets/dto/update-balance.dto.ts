import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBalanceDto {
  @ApiProperty({
    example: 1000,
    description: 'Amount to add (positive) or subtract (negative) from wallet balance (in cents)'
  })
  @IsNotEmpty()
  @IsInt()
  amount: number;
}

