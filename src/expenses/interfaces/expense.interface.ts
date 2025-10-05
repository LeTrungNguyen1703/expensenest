import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { transaction_type_enum } from "@prisma/client";

export interface Expense {
  expense_id: number;
  title: string;
  amount: number;
  transaction_type: transaction_type_enum;
  category_id: number;
  wallet_id: number;
  expense_date: Date;
  description: string | null;
  user_id: number;
  recurring_transaction_id: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export class ExpenseResponse {
  @ApiProperty()
  @Expose()
  expense_id: number;

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

  @ApiProperty()
  @Expose()
  expense_date: Date;

  @ApiProperty({ nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty()
  @Expose()
  user_id: number;

  @ApiProperty({ nullable: true })
  @Expose()
  recurring_transaction_id: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  created_at: Date | null;

  @ApiProperty({ nullable: true })
  @Expose()
  updated_at: Date | null;
}

