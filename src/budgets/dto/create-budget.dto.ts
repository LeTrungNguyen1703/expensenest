import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsEnum, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { period_type_enum } from '@prisma/client';

export class CreateBudgetDto {
  @ApiProperty({ description: 'Budget name', example: 'Monthly Groceries' })
  @IsString()
  @IsNotEmpty()
  budget_name: string;

  @ApiProperty({ description: 'Category ID', example: 1 })
  @IsInt()
  category_id: number;

  @ApiProperty({ description: 'Amount in cents' , example: 50000 })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: period_type_enum, description: 'Period type' })
  @IsEnum(period_type_enum)
  period_type: period_type_enum;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', example: '2025-10-13' })
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD) or null', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Is active, if null it will be default true' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
