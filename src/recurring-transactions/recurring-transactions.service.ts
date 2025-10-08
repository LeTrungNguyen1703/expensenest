import {Injectable, NotFoundException, BadRequestException, Logger} from '@nestjs/common';
import {CreateRecurringTransactionDto} from './dto/create-recurring-transaction.dto';
import {UpdateRecurringTransactionDto} from './dto/update-recurring-transaction.dto';
import {PrismaService} from '../prisma/prisma.service';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {RecurringTransaction, RecurringTransactionResponse} from './interfaces/recurring-transaction.interface';
import {transaction_type_enum, frequency_enum} from '@prisma/client';
import {RecurringTransactionQueue} from "./queue/recurring-transaction.queue";
import {ExpenseResponse} from "../expenses/interfaces/expense.interface";
import {RecurringTransactionLogsService} from "../recurring_transaction_logs/recurring_transaction_logs.service";
import {CreateRecurringTransactionLogDto} from "../recurring_transaction_logs/dto/create-recurring_transaction_log.dto";

@Injectable()
export class RecurringTransactionsService {
    private logger = new Logger(RecurringTransactionsService.name);

    constructor(private readonly prisma: PrismaService) {
    }

    // Helper function to calculate next occurrence based on frequency
    private calculateNextOccurrence(startDate: Date, frequency: frequency_enum): Date {
        const next = new Date(startDate);
        switch (frequency) {
            case frequency_enum.DAILY:
                next.setDate(next.getDate() + 1);
                break;
            case frequency_enum.WEEKLY:
                next.setDate(next.getDate() + 7);
                break;
            case frequency_enum.BIWEEKLY:
                next.setDate(next.getDate() + 14);
                break;
            case frequency_enum.MONTHLY:
                next.setMonth(next.getMonth() + 1);
                break;
            case frequency_enum.QUARTERLY:
                next.setMonth(next.getMonth() + 3);
                break;
            case frequency_enum.YEARLY:
                next.setFullYear(next.getFullYear() + 1);
                break;
        }
        return next;
    }

    /**
     * Private helper method to verify ownership of a recurring transaction
     */
    private async verifyOwnership(recurringId: number, userId: number) {
        const existing = await this.prisma.recurring_transactions.findUnique({
            where: {recurring_id: recurringId},
        });

        if (!existing) {
            throw new NotFoundException(`Recurring transaction with ID ${recurringId} not found`);
        }

        if (existing.user_id !== userId) {
            throw new BadRequestException('You do not have permission to modify this recurring transaction');
        }
        return existing;
    }

    async create(createRecurringTransactionDto: CreateRecurringTransactionDto, userId: number): Promise<RecurringTransactionResponse> {
        const {start_date, end_date, frequency, ...otherFields} = createRecurringTransactionDto;
        const startDate = new Date(start_date);
        const nextOccurrence = this.calculateNextOccurrence(startDate, frequency);

        try {
            return await this.prisma.recurring_transactions.create({
                data: {
                    user_id: userId,
                    ...otherFields,
                    frequency,
                    start_date: startDate,
                    end_date: end_date ? new Date(end_date) : null,
                    next_occurrence: nextOccurrence,
                    is_active: createRecurringTransactionDto.is_active ?? true,
                    auto_create: createRecurringTransactionDto.auto_create ?? true,
                    reminder_days_before: createRecurringTransactionDto.reminder_days_before ?? 1,
                },
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('User, Category, or Wallet not found');
                }
            }
            throw error;
        }
    }

    async findAll(): Promise<RecurringTransactionResponse[]> {
        return this.prisma.recurring_transactions.findMany({
            orderBy: {
                next_occurrence: 'asc',
            },
        });
    }

    async findOne(id: number): Promise<RecurringTransactionResponse> {
        const transaction = await this.prisma.recurring_transactions.findUnique({
            where: {recurring_id: id},
        });

        if (!transaction) {
            throw new NotFoundException(`Recurring transaction with ID ${id} not found`);
        }

        return transaction;
    }

    async findByUserId(userId: number): Promise<RecurringTransactionResponse[]> {
        return this.prisma.recurring_transactions.findMany({
            where: {user_id: userId},
            orderBy: {
                next_occurrence: 'asc',
            },
        });
    }

    async findByType(userId: number, type: transaction_type_enum): Promise<RecurringTransactionResponse[]> {
        return this.prisma.recurring_transactions.findMany({
            where: {
                user_id: userId,
                transaction_type: type
            },
            orderBy: {
                next_occurrence: 'asc',
            },
        });
    }

    async findActive(userId: number): Promise<RecurringTransactionResponse[]> {
        return this.prisma.recurring_transactions.findMany({
            where: {
                user_id: userId,
                is_active: true
            },
            orderBy: {
                next_occurrence: 'asc',
            },
        });
    }

    async update(id: number, updateRecurringTransactionDto: UpdateRecurringTransactionDto, userId: number): Promise<RecurringTransactionResponse> {
        // Verify ownership
        const existing = await this.verifyOwnership(id, userId);

        // Prepare update data
        const {frequency, start_date, end_date, ...otherUpdates} = updateRecurringTransactionDto;
        const dataToUpdate: any = {
            ...otherUpdates,
            updated_at: new Date(),
        };

        // Handle date conversions
        if (end_date !== undefined) {
            dataToUpdate.end_date = end_date ? new Date(end_date) : null;
        }

        // Recalculate next_occurrence if frequency or start_date changes
        if (frequency !== undefined || start_date !== undefined) {
            const newStartDate = start_date ? new Date(start_date) : existing.start_date;
            const newFrequency = frequency ?? existing.frequency;

            if (start_date !== undefined) {
                dataToUpdate.start_date = new Date(start_date);
            }
            if (frequency !== undefined) {
                dataToUpdate.frequency = frequency;
            }

            dataToUpdate.next_occurrence = this.calculateNextOccurrence(newStartDate, newFrequency);
        }

        try {
            return await this.prisma.recurring_transactions.update({
                where: {recurring_id: id},
                data: dataToUpdate,
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('Category or Wallet not found');
                }
            }
            throw error;
        }
    }

    async remove(id: number, userId: number): Promise<{
        message: string;
        transaction: Partial<RecurringTransactionResponse>
    }> {
        // Verify ownership using helper method
        await this.verifyOwnership(id, userId);

        try {
            const deleted = await this.prisma.recurring_transactions.delete({
                where: {recurring_id: id},
                select: {
                    recurring_id: true,
                    title: true,
                    amount: true,
                    frequency: true,
                },
            });

            return {
                message: `Recurring transaction ${deleted.title} has been deleted`,
                transaction: deleted,
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Recurring transaction with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    async toggleActive(id: number, userId: number): Promise<RecurringTransactionResponse> {
        // Verify ownership
        const existing = await this.verifyOwnership(id, userId);

        return this.prisma.recurring_transactions.update({
            where: {recurring_id: id},
            data: {
                is_active: !existing.is_active,
                updated_at: new Date(),
            },
        });
    }

    // Method này sẽ được gọi vào một job định kỳ (cron job) hàng ngày lúc 00:01 ở RecurringTransactionQueue
    async processDueTransactions() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tìm các recurring transactions cần xử lý
        const dueTransactions = await this.prisma.recurring_transactions.findMany({
            where: {
                is_active: true,
                next_occurrence: {
                    lte: today,
                },
                OR: [
                    {end_date: null}, // Không có ngày kết thúc
                    {end_date: {gte: today}}, // Chưa hết hạn
                ],
            },
        });

        this.logger.log(`Found ${dueTransactions.length} due transactions`);

        return dueTransactions;
    }

    /**
     * Xử lý một recurring transaction cụ thể
     */
    async processRecurring(recurringId: number): Promise<ExpenseResponse | null> {
        const recurring = await this.prisma.recurring_transactions.findUnique({
            where: {recurring_id: recurringId},
        });

        if (!recurring) {
            throw new NotFoundException(`Active recurring transaction with ID ${recurringId} not found`);
        }
        if (!recurring.is_active) {
            return null; // Không làm gì nếu không active
        }
        let expense: ExpenseResponse | null = null;

        expense = await this.prisma.$transaction(async (tx) => {
            let createExpense: ExpenseResponse | null = null;
            // 1. Tạo expense nếu auto_create = true
            if (recurring.auto_create) {
                createExpense = await tx.expenses.create({
                    data: {
                        user_id: recurring.user_id,
                        title: recurring.title,
                        amount: recurring.amount,
                        transaction_type: recurring.transaction_type,
                        category_id: recurring.category_id,
                        wallet_id: recurring.wallet_id,
                        description: recurring.description,
                        expense_date: new Date(),
                        // Liên kết với recurring transaction
                        recurring_transaction_id: recurring.recurring_id,
                    },

                });

                this.logger.log(`✅ Created expense #${createExpense} from recurring #${recurringId}`);
            }
            //TODO:
            // 2. Log lại việc xử lý
            await tx.recurring_transaction_logs.create({
                data: {
                    recurring_id: recurring.recurring_id,
                    expense_id: createExpense ? createExpense.expense_id : null,
                    scheduled_date: recurring.next_occurrence,
                    executed_date: new Date(),
                    status: createExpense ? 'COMPLETED' : 'SKIPPED',
                }
            })

            // 3. Tính next_occurrence mới
            const nextOccurrence = this.calculateNextOccurrence(
                recurring.next_occurrence,
                recurring.frequency,
            );

            // 4. Update recurring transaction
            await tx.recurring_transactions.update({
                where: {recurring_id: recurringId},
                data: {
                    last_occurrence: recurring.next_occurrence,
                    next_occurrence: nextOccurrence,
                    updated_at: new Date(),
                },
            });

            //5: Notify được triễn khai ở RecurringTransactionProcessor
            return createExpense;
        });

        return expense;
    }
}
