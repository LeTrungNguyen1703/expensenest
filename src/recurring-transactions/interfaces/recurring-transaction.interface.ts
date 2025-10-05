import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { transaction_type_enum, frequency_enum } from "@prisma/client";

export interface RecurringTransaction {
  recurring_id: number;
  user_id: number;
  title: string;
  amount: number;
  transaction_type: transaction_type_enum;
  category_id: number;
  wallet_id: number;
  frequency: frequency_enum;
  start_date: Date;
  end_date: Date | null;
  next_occurrence: Date;
  last_occurrence: Date | null;
  description: string | null;
  is_active: boolean | null;
  auto_create: boolean | null;
  reminder_days_before: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export class RecurringTransactionResponse {
  @ApiProperty()
  @Expose()
  recurring_id: number;

  @ApiProperty()
  @Expose()
  user_id: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  amount: number;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @Expose()
  transaction_type: transaction_type_enum;

  @ApiProperty()
  @Expose()
  category_id: number;

  @ApiProperty()
  @Expose()
  wallet_id: number;

  @ApiProperty({ enum: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] })
  @Expose()
  frequency: frequency_enum;

  @ApiProperty()
  @Expose()
  start_date: Date;

  @ApiProperty({ nullable: true })
  @Expose()
  end_date: Date | null;

  @ApiProperty()
  @Expose()
  next_occurrence: Date;

  @ApiProperty({ nullable: true })
  @Expose()
  last_occurrence: Date | null;

  @ApiProperty({ nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  is_active: boolean | null;

  @ApiProperty({ nullable: true })
  @Expose()
  auto_create: boolean | null;

  @ApiProperty({ nullable: true })
  @Expose()
  reminder_days_before: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  created_at: Date | null;

  @ApiProperty({ nullable: true })
  @Expose()
  updated_at: Date | null;
}

