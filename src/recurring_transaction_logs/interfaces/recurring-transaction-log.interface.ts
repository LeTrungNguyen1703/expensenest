import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Interface representing a recurring transaction log record from the database.
 */
export interface RecurringTransactionLog {
  log_id: number;
  recurring_id: number;
  scheduled_date: Date;
  executed_date: Date | null;
  expense_id: number | null;
  status: string;
  notes: string | null;
  created_at: Date | null;
}

/**
 * Response DTO (class) for recurring transaction logs returned by controllers/services.
 * - Uses @Expose() and @ApiProperty() as required by the project's conventions.
 */
export class RecurringTransactionLogResponse implements RecurringTransactionLog {
  @ApiProperty()
  @Expose()
  log_id: number;

  @ApiProperty()
  @Expose()
  recurring_id: number;

  @ApiProperty({ type: 'string', format: 'date' })
  @Expose()
  scheduled_date: Date;

  @ApiProperty({ nullable: true, type: 'string', format: 'date' })
  @Expose()
  executed_date: Date | null;

  @ApiProperty({ nullable: true })
  @Expose()
  expense_id: number | null;

  @ApiProperty()
  @Expose()
  status: string;

  @ApiProperty({ nullable: true })
  @Expose()
  notes: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  created_at: Date | null;
}

