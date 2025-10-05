import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { transaction_type_enum } from "@prisma/client";

export interface Category {
  category_id: number;
  category_name: string;
  transaction_type: transaction_type_enum;
  description: string | null;
  user_id: number | null;
  created_at: Date | null;
}

export class CategoryResponse {
  @ApiProperty()
  @Expose()
  category_id: number;

  @ApiProperty()
  @Expose()
  category_name: string;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @Expose()
  transaction_type: transaction_type_enum;

  @ApiProperty({ nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({ nullable: true })
  @Expose()
  user_id: number | null;

  @ApiProperty({ nullable: true })
  @Expose()
  created_at: Date | null;
}

