import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { goal_status_enum } from '@prisma/client';

export class CreateSavingsGoalDto {
  @ApiProperty({ example: 'Emergency Fund', description: 'Name of the savings goal' })
  @IsNotEmpty()
  @IsString()
  goal_name: string;

  @ApiPropertyOptional({ example: 'Save for unexpected expenses', description: 'Goal description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5000000, description: 'Target amount in cents', minimum: 0 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  target_amount: number;

  @ApiPropertyOptional({ example: 1000000, description: 'Current amount saved in cents', minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  current_amount?: number;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Target completion date', nullable: true })
  @IsOptional()
  @IsDateString()
  target_date?: string;

  @ApiPropertyOptional({ example: 1, description: 'Priority level (higher is more important)', minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ example: 'piggy-bank', description: 'Icon name', nullable: true })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#4CAF50', description: 'Color code', nullable: true })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 1, description: 'Wallet ID to link to', nullable: true })
  @IsOptional()
  @IsInt()
  wallet_id?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Goal status', enum: ['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'], default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(goal_status_enum)
  status?: goal_status_enum;

  @ApiPropertyOptional({ example: false, description: 'Is this a recurring goal', default: false })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;
}
