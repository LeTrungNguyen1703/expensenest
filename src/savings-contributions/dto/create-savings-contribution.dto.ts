import {IsInt, Min, IsOptional, IsString} from 'class-validator';
import {Type} from 'class-transformer';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class CreateSavingsContributionDto {
    @ApiProperty({description: 'Savings goal ID to which contribution applies', example: 1})
    @Type(() => Number)
    @IsInt()
    @Min(1)
    goal_id: number;

    @ApiProperty({description: 'Amount to contribute (positive integer)', example: 100})
    @Type(() => Number)
    @IsInt()
    @Min(1)
    amount: number;

    @ApiPropertyOptional({description: 'Optional notes for the contribution', example: 'Transfer from checking'})
    @IsOptional()
    @IsString()
    notes?: string;
}
