import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { transaction_type_enum, frequency_enum } from '@prisma/client';

export class CreateRecurringTransactionDto {
  @ApiProperty({ example: 'Monthly Salary', description: 'Title of the recurring transaction' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 500000, description: 'Transaction amount in cents', minimum: 0 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'INCOME', description: 'Type of transaction', enum: ['INCOME', 'EXPENSE'] })
  @IsNotEmpty()
  @IsEnum(transaction_type_enum)
  transaction_type: transaction_type_enum;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsNotEmpty()
  @IsInt()
  category_id: number;

  @ApiProperty({ example: 1, description: 'Wallet ID' })
  @IsNotEmpty()
  @IsInt()
  wallet_id: number;

  @ApiProperty({ example: 'MONTHLY', description: 'Frequency of recurrence', enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] })
  @IsNotEmpty()
  @IsEnum(frequency_enum)
  frequency: frequency_enum;

  @ApiProperty({ example: '2025-01-01', description: 'Start date of recurrence' })
  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'End date of recurrence (optional)', nullable: true })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ example: 'Monthly income from salary', description: 'Transaction description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Is the recurring transaction active', default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Auto-create expense entries', default: true })
  @IsOptional()
  @IsBoolean()
  auto_create?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'Days before to send reminder', minimum: 0, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reminder_days_before?: number;
}
