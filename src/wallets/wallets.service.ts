import {Injectable, NotFoundException, ConflictException, BadRequestException} from '@nestjs/common';
import {CreateWalletDto} from './dto/create-wallet.dto';
import {UpdateWalletDto} from './dto/update-wallet.dto';
import {PrismaService} from '../prisma/prisma.service';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {WalletResponse} from './interfaces/wallet.interface';
import {PrismaPagination} from '../common/helpers/prisma-pagination.helper';
import {PaginatedResponse} from '../common/interfaces/paginated-response.interface';

@Injectable()
export class WalletsService {
    constructor(private readonly prisma: PrismaService) {
    }

    // Create wallet: userId must come from JWT (controller)
    async create(createWalletDto: CreateWalletDto, userId: number): Promise<WalletResponse> {
        try {
            const {wallet_name, balance} = createWalletDto;

            return await this.prisma.wallets.create({
                data: {
                    wallet_name,
                    balance: balance ?? 0,
                    user_id: userId,
                },
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('User not found');
                }
                if (error.code === 'P2002') {
                    // Unique constraint failed
                    throw new ConflictException('Wallet with the same name already exists');
                }
            }
            throw error;
        }
    }

    // Admin: list all wallets with optional pagination
    async findAll(page = 1, limit = 10): Promise<PaginatedResponse<WalletResponse>> {
        return PrismaPagination.paginate<WalletResponse>(
            this.prisma.wallets,
            page,
            limit,
            undefined,
            {created_at: 'desc'},
        );
    }

    async findOne(id: number): Promise<WalletResponse> {
        const wallet = await this.prisma.wallets.findUnique({
            where: {wallet_id: id},
        });

        if (!wallet) {
            throw new NotFoundException(`Wallet with ID ${id} not found`);
        }

        return wallet;
    }

    // List wallets for a specific user with optional pagination
    async findByUserId(userId: number, page = 1, limit = 10): Promise<PaginatedResponse<WalletResponse>> {
        return PrismaPagination.paginate<WalletResponse>(
            this.prisma.wallets,
            page,
            limit,
            {user_id: userId},
            {created_at: 'desc'},
        );
    }

    // Update with ownership verification
    async update(id: number, updateWalletDto: UpdateWalletDto, userId: number): Promise<WalletResponse> {
        // Verify ownership
        await this.verifyOwnership(id, userId);

        try {
            const {...otherUpdates} = updateWalletDto as any;
            const dataToUpdate: any = {
                ...otherUpdates,
                updated_at: new Date(),
            };

            return await this.prisma.wallets.update({
                where: {wallet_id: id},
                data: dataToUpdate,
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Wallet with ID ${id} not found`);
                }
                if (error.code === 'P2003') {
                    throw new NotFoundException('User not found');
                }
                if (error.code === 'P2002') {
                    throw new ConflictException('Wallet update would violate a unique constraint');
                }
            }
            throw error;
        }
    }

    // Delete with ownership verification
    async remove(id: number, userId: number): Promise<{ message: string; wallet: Partial<WalletResponse> }> {
        // Verify ownership
        await this.verifyOwnership(id, userId)
        try {
            const deletedWallet = await this.prisma.wallets.delete({
                where: {wallet_id: id},
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

    // Update balance with ownership verification
    async updateBalance(id: number, amount: number, userId: number): Promise<WalletResponse> {
        // Verify ownership
        await this.verifyOwnership(id, userId)

        try {
            return await this.prisma.wallets.update({
                where: {wallet_id: id},
                data: {
                    balance: {
                        increment: amount,
                    },
                    updated_at: new Date(),
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

    private async verifyOwnership(walletId: number, userId: number) {
        // This method can be implemented to reduce code duplication
        // Verify ownership
        const existing = await this.prisma.wallets.findUnique({
            where: {wallet_id: walletId},
            select: {user_id: true},
        });

        if (!existing) {
            throw new NotFoundException(`Wallet with ID ${walletId} not found`);
        }

        if (existing.user_id !== userId) {
            throw new BadRequestException('You do not have permission to modify this wallet');
        }
    }
}
