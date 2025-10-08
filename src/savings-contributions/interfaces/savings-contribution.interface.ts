// ...existing code...
import {ApiProperty} from '@nestjs/swagger';
import {Expose} from 'class-transformer';

/**
 * Interface representing a savings contribution record from the database.
 * Note: this interface intentionally does NOT include the related `expenses` object/relation.
 */
export interface SavingsContribution {
    contribution_id: number;
    goal_id: number;
    amount: number;
    contribution_date: Date;
    notes: string | null;
    user_id: number;
    created_at: Date | null;
}

/**
 * Response DTO (class) for savings contributions returned by controllers/services.
 * - Uses @Expose() and @ApiProperty() as required by the project's conventions.
 * - Does NOT expose the related `expenses` relation (the user requested to skip that field).
 */
export class SavingsContributionResponse {
    @ApiProperty()
    @Expose()
    contribution_id: number;

    @ApiProperty()
    @Expose()
    goal_id: number;

    @ApiProperty()
    @Expose()
    amount: number;

    @ApiProperty({type: 'string', format: 'date'})
    @Expose()
    contribution_date: Date;

    @ApiProperty({nullable: true})
    @Expose()
    notes: string | null;

    @ApiProperty({nullable: true})
    @Expose()
    created_at: Date | null;
}

// ...existing code...

