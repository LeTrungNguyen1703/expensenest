import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Wallet, WalletResponse } from './interfaces/wallet.interface';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWalletDto: CreateWalletDto): Promise<WalletResponse> {
    try {
      return await this.prisma.wallets.create({
        data: {
          wallet_name: createWalletDto.wallet_name,
          balance: createWalletDto.balance ?? 0,
          user_id: createWalletDto.user_id,
        },
        select: {
          wallet_id: true,
          wallet_name: true,
          balance: true,
          user_id: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('User not found');
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<WalletResponse[]> {
    return this.prisma.wallets.findMany({
      select: {
        wallet_id: true,
        wallet_name: true,
        balance: true,
        user_id: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<WalletResponse> {
    const wallet = await this.prisma.wallets.findUnique({
      where: { wallet_id: id },
      select: {
        wallet_id: true,
        wallet_name: true,
        balance: true,
        user_id: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    return wallet;
  }

  async findByUserId(userId: number): Promise<WalletResponse[]> {
    return this.prisma.wallets.findMany({
      where: { user_id: userId },
      select: {
        wallet_id: true,
        wallet_name: true,
        balance: true,
        user_id: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async update(id: number, updateWalletDto: UpdateWalletDto): Promise<WalletResponse> {
    try {
      return await this.prisma.wallets.update({
        where: { wallet_id: id },
        data: {
          ...updateWalletDto,
          updated_at: new Date(),
        },
        select: {
          wallet_id: true,
          wallet_name: true,
          balance: true,
          user_id: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Wallet with ID ${id} not found`);
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('User not found');
        }
      }
      throw error;
    }
  }

  async remove(id: number): Promise<{ message: string; wallet: Partial<WalletResponse> }> {
    try {
      const deletedWallet = await this.prisma.wallets.delete({
        where: { wallet_id: id },
        select: {
          wallet_id: true,
          wallet_name: true,
          user_id: true,
        },
      });

      return {
        message: `Wallet ${deletedWallet.wallet_name} has been deleted`,
        wallet: deletedWallet,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Wallet with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async updateBalance(id: number, amount: number): Promise<WalletResponse> {
    try {
      return await this.prisma.wallets.update({
        where: { wallet_id: id },
        data: {
          balance: {
            increment: amount,
          },
          updated_at: new Date(),
        },
        select: {
          wallet_id: true,
          wallet_name: true,
          balance: true,
          user_id: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Wallet with ID ${id} not found`);
        }
      }
      throw error;
    }
  }
}
