import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { period_type_enum } from '@prisma/client';

export interface Budget {
  budget_id: number;
  budget_name: string;
  category_id: number;
  amount: number;
  period_type: period_type_enum;
  start_date: Date;
  end_date: Date | null;
  is_active: boolean | null;
  user_id: number;
  created_at: Date | null;
  updated_at: Date | null;
}

export class BudgetResponse {
  @ApiProperty()
  @Expose()
  budget_id: number;

  @ApiProperty()
  @Expose()
  budget_name: string;

  @ApiProperty()
  @Expose()
  category_id: number;

  @ApiProperty()
  @Expose()
  amount: number;

  @ApiProperty({ enum: period_type_enum })
  @Expose()
  period_type: period_type_enum;

  @ApiProperty({ type: String })
  @Expose()
  start_date: Date;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  end_date: Date | null;

  @ApiProperty({ nullable: true })
  @Expose()
  is_active: boolean | null;

  @ApiProperty()
  @Expose()
  user_id: number;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  created_at: Date | null;

  @ApiProperty({ type: String, nullable: true })
  @Expose()
  updated_at: Date | null;
}

