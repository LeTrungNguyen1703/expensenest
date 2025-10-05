import { Expose } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export interface Wallet {
  wallet_id: number;
  wallet_name: string;
  balance: number | null;
  user_id: number;
  created_at: Date | null;
  updated_at: Date | null;
}

export class WalletResponse {
  @ApiProperty()
  @Expose()
  wallet_id: number;

  @ApiProperty()
  @Expose()
  wallet_name: string;

  @ApiProperty({ nullable: true })
  @Expose()
  balance: number | null;

  @ApiProperty()
  @Expose()
  user_id: number;

  @ApiProperty({ nullable: true })
  @Expose()
  created_at: Date | null;

  @ApiProperty({ nullable: true, required: false })
  @Expose()
  updated_at?: Date | null;
}
