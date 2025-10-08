import {Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import {CreateRecurringTransactionLogDto} from './dto/create-recurring_transaction_log.dto';
import {UpdateRecurringTransactionLogDto} from './dto/update-recurring_transaction_log.dto';
import {PrismaService} from '../prisma/prisma.service';
import {RecurringTransactionLogResponse} from './interfaces/recurring-transaction-log.interface';
import {PrismaPagination} from '../common/helpers/prisma-pagination.helper';
import {PaginatedResponse} from '../common/interfaces/paginated-response.interface';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';

@Injectable()
export class RecurringTransactionLogsService {
    constructor(private readonly prisma: PrismaService) {
    }

    /**
     * Private helper method to verify ownership of a recurring transaction log
     */
    private async verifyOwnership(logId: number, userId: number): Promise<void> {
        const log = await this.prisma.recurring_transaction_logs.findUnique({
            where: {log_id: logId},
            select: {
                log_id: true,
                recurring_transactions: {
                    select: {user_id: true},
                },
            },
        });

        if (!log) {
            throw new NotFoundException(`Recurring transaction log with ID ${logId} not found`);
        }

        if (log.recurring_transactions.user_id !== userId) {
            throw new BadRequestException('You do not have permission to access this log');
        }
    }

    async findAll(page = 1, limit = 10): Promise<PaginatedResponse<RecurringTransactionLogResponse>> {
        return PrismaPagination.paginate<RecurringTransactionLogResponse>(
            this.prisma.recurring_transaction_logs,
            page,
            limit,
            undefined,
            {created_at: 'desc'}
        );
    }

    async findOne(id: number): Promise<RecurringTransactionLogResponse> {
        const log = await this.prisma.recurring_transaction_logs.findUnique({
            where: {log_id: id},
        });

        if (!log) {
            throw new NotFoundException(`Recurring transaction log with ID ${id} not found`);
        }

        return log;
    }

    async findByUserId(userId: number, page = 1, limit = 10): Promise<PaginatedResponse<RecurringTransactionLogResponse>> {
        return PrismaPagination.paginate<RecurringTransactionLogResponse>(
            this.prisma.recurring_transaction_logs,
            page,
            limit,
            {
                recurring_transactions: {
                    user_id: userId,
                },
            },
            {created_at: 'desc'}
        );
    }

    async findByRecurringId(recurringId: number, userId: number, page = 1, limit = 10): Promise<PaginatedResponse<RecurringTransactionLogResponse>> {
        // Verify the recurring transaction belongs to the user
        const recurringTransaction = await this.prisma.recurring_transactions.findUnique({
            where: {recurring_id: recurringId},
            select: {user_id: true},
        });

        if (!recurringTransaction) {
            throw new NotFoundException(`Recurring transaction with ID ${recurringId} not found`);
        }

        if (recurringTransaction.user_id !== userId) {
            throw new BadRequestException('You do not have permission to access logs for this recurring transaction');
        }

        return PrismaPagination.paginate<RecurringTransactionLogResponse>(
            this.prisma.recurring_transaction_logs,
            page,
            limit,
            {recurring_id: recurringId},
            {scheduled_date: 'desc'}
        );
    }

    async findByStatus(status: string, userId: number, page = 1, limit = 10): Promise<PaginatedResponse<RecurringTransactionLogResponse>> {
        return PrismaPagination.paginate<RecurringTransactionLogResponse>(
            this.prisma.recurring_transaction_logs,
            page,
            limit,
            {
                status,
                recurring_transactions: {
                    user_id: userId,
                },
            },
            {scheduled_date: 'desc'}
        );
    }

    async remove(id: number, userId: number): Promise<{
        message: string;
        log: Partial<RecurringTransactionLogResponse>
    }> {
        await this.verifyOwnership(id, userId);

        try {
            const deleted = await this.prisma.recurring_transaction_logs.delete({
                where: {log_id: id},
                select: {
                    log_id: true,
                    recurring_id: true,
                    scheduled_date: true,
                    status: true,
                },
            });

            return {
                message: `Recurring transaction log ${deleted.log_id} has been deleted`,
                log: deleted,
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Recurring transaction log with ID ${id} not found`);
                }
            }
            throw error;
        }
    }
}
