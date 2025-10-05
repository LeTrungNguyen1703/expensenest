import { IsNotEmpty, IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { transaction_type_enum } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries', description: 'Name of the category' })
  @IsNotEmpty()
  @IsString()
  category_name: string;

  @ApiProperty({ example: 'EXPENSE', description: 'Type of transaction', enum: ['INCOME', 'EXPENSE'] })
  @IsNotEmpty()
  @IsEnum(transaction_type_enum)
  transaction_type: transaction_type_enum;

  @ApiPropertyOptional({ example: 'Food and groceries', description: 'Category description', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'User ID who owns the category (null for system categories)', nullable: true })
  @IsOptional()
  @IsInt()
  user_id?: number;
}
