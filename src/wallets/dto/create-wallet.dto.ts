import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty({ example: 'Main Wallet', description: 'Name of the wallet' })
  @IsNotEmpty()
  @IsString()
  wallet_name: string;

  @ApiPropertyOptional({ example: 10000, description: 'Initial balance (in cents)', minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  balance?: number;
}
