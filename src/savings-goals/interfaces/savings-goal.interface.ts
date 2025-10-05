import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { goal_status_enum } from "@prisma/client";

export interface SavingsGoal {
  goal_id: number;
  user_id: number;
  goal_name: string;
  description: string | null;
  target_amount: number;
  current_amount: number | null;
  target_date: Date | null;
  priority: number | null;
  icon: string | null;
  color: string | null;
  wallet_id: number | null;
  status: goal_status_enum | null;
  is_recurring: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
  completed_at: Date | null;
}

export class SavingsGoalResponse {
  @ApiProperty()
  @Expose()
  goal_id: number;

  @ApiProperty()
  @Expose()
  user_id: number;

  @ApiProperty()
  @Expose()
  goal_name: string;

  @ApiProperty({ nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty()
  @Expose()
  target_amount: number;

  @ApiProperty({ nullable: true })
  @Expose()
  current_amount: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  target_date: Date | null;

  @ApiProperty({ nullable: true })
  @Expose()
  priority: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  icon: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  color: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  wallet_id: number | null;

  @ApiProperty({ enum: ['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'], nullable: true })
  @Expose()
  status: goal_status_enum | null;

  @ApiProperty({ nullable: true })
  @Expose()
  is_recurring: boolean | null;

  @ApiProperty({ nullable: true })
  @Expose()
  created_at: Date | null;

  @ApiProperty({ nullable: true })
  @Expose()
  updated_at: Date | null;

  @ApiProperty({ nullable: true })
  @Expose()
  completed_at: Date | null;
}

