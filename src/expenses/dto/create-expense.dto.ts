import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { transaction_type_enum } from '@prisma/client';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Grocery Shopping', description: 'Title of the expense' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 50000, description: 'Expense amount in cents', minimum: 0 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'EXPENSE', description: 'Type of transaction', enum: ['INCOME', 'EXPENSE'] })
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

  @ApiProperty({ example: '2025-01-15', description: 'Date of the expense' })
  @IsNotEmpty()
  @IsDateString()
  expense_date: string;

  @ApiPropertyOptional({ example: 'Weekly groceries from supermarket', description: 'Expense description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'Recurring transaction ID if created from recurring', nullable: true })
  @IsOptional()
  @IsInt()
  recurring_transaction_id?: number;
}
