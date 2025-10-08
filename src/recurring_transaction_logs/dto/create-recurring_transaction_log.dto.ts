import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsInt, IsString, IsOptional, IsDateString, MaxLength} from 'class-validator';

export class CreateRecurringTransactionLogDto {
    @ApiProperty({
        description: 'ID of the recurring transaction',
        example: 1,
    })
    @IsInt()
    recurring_id: number;

    @ApiProperty({
        description: 'Scheduled date for the transaction',
        example: '2025-10-15',
    })
    @IsDateString()
    scheduled_date: Date;

    @ApiPropertyOptional({
        description: 'Actual execution date (if executed)',
        example: '2025-10-15',
    })
    @IsOptional()
    @IsDateString()
    executed_date?: Date;

    @ApiPropertyOptional({
        description: 'ID of the created expense (if any)',
        example: 1,
    })
    @IsOptional()
    @IsInt()
    expense_id?: number;

    @ApiPropertyOptional({
        description: 'Status of the log',
        example: 'PENDING',
        default: 'PENDING',
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    status?: string;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Transaction processed successfully',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}
