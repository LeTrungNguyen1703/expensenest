import {Inject, Injectable, Logger} from '@nestjs/common';
import {UpdateSummaryDto} from './dto/update-summary.dto';
import {PrismaService} from "../prisma/prisma.service";
import {transaction_type_enum} from "@prisma/client";
import {SummaryResponse} from "./dto/response-summary.dto";
import {CACHE_MANAGER, Cache} from "@nestjs/cache-manager";
import {ExpenseResponse} from "../expenses/interfaces/expense.interface";
import {OnEvent} from "@nestjs/event-emitter";
import {EVENTS} from "../common/constants/events.constants";

@Injectable()
export class SummaryService {
    private logger = new Logger(SummaryService.name);

    constructor(private readonly prisma: PrismaService,
                @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
    }

    async summaryExpenseByMonthAndCategory(userId: number, categoryId: number, date: Date, transactionType: transaction_type_enum): Promise<SummaryResponse | {
        messages: string
    }> {

        let summary: SummaryResponse | null | undefined;

        const cacheKey = `summary_${userId}_${categoryId}_${date.getFullYear()}_${date.getMonth() + 1}_${transactionType}`;

        summary = await this.cacheManager.get<SummaryResponse>(cacheKey);

        if (summary) {
            this.logger.debug(`Cache hit for key: ${cacheKey}`);
            return summary;
        }

        const [startDate, endDate] = this.convertToStartAndEndOfMonth(date);

        const expenses = await this.prisma.expenses.findMany({
            where: {
                user_id: userId,
                category_id: categoryId,
                expense_date: {
                    gte: startDate,
                    lte: endDate,
                },
                transaction_type: transactionType
            },
            include: {
                categories: {
                    select: {
                        category_id: true,
                        category_name: true,
                    }
                }
            }
        })

        if (expenses.length === 0) {
            return {
                messages: 'No expense in this category for the given month'
            }
        }

        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const averageAmount = totalAmount / expenses.length;
        const maxAmount = Math.max(...expenses.map(expense => expense.amount));
        const minAmount = Math.min(...expenses.map(expense => expense.amount));
        const monthlyExpenseCount = expenses.length;


        summary = {
            totalAmount,
            averageAmount,
            maxAmount,
            minAmount,
            monthlyExpenseCount,
            category: expenses[0].categories || {messages: 'Category not found'},
        }

        this.logger.log(`Summary for category ID ${categoryId} in ${date.getMonth() + 1}/${date.getFullYear()}:`, summary);
        try {
            // TTL phải là milliseconds cho Keyv/KeyvRedis: 1800000ms = 30 phút
            await this.cacheManager.set(cacheKey, summary, 1800000);
            this.logger.debug(`✅ Cache set for key: ${cacheKey} with 30 minutes TTL`);
        } catch (error) {
            this.logger.error(`❌ Failed to set cache for key: ${cacheKey}`, error.message);
        }

        return summary;
    }

    private convertToStartAndEndOfMonth(date?: Date) {
        const now = date || new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
        return [startDate, endDate];
    }

    @OnEvent(EVENTS.EXPENSE.CREATED)
    async delCacheWhenExpenseChange(expense: ExpenseResponse) {
        this.logger.debug(`Event received: ${EVENTS.EXPENSE.CREATED} for expense ID ${expense.expense_id}`);
        const date = new Date(expense.expense_date);
        const cacheKey = `summary_${expense.user_id}_${expense.category_id}_${date.getFullYear()}_${date.getMonth() + 1}_${expense.transaction_type}`;
        await this.cacheManager.del(cacheKey);
        this.logger.debug(`Cache deleted for key: ${cacheKey}`);
    }

    @OnEvent(EVENTS.EXPENSE.UPDATED)
    async delCacheWhenExpenseUpdated(expense: ExpenseResponse) {
        this.logger.debug(`Event received: ${EVENTS.EXPENSE.UPDATED} for expense ID ${expense.expense_id}`);
        const date = new Date(expense.expense_date);
        const cacheKey = `summary_${expense.user_id}_${expense.category_id}_${date.getFullYear()}_${date.getMonth() + 1}_${expense.transaction_type}`;
        await this.cacheManager.del(cacheKey);
        this.logger.debug(`Cache deleted for key: ${cacheKey}`);
    }

    @OnEvent(EVENTS.EXPENSE.DELETED)
    async delCacheWhenExpenseDeleted(expense: ExpenseResponse) {
        this.logger.debug(`Event received: ${EVENTS.EXPENSE.DELETED} for expense ID ${expense.expense_id}`);
        const date = new Date(expense.expense_date);
        const cacheKey = `summary_${expense.user_id}_${expense.category_id}_${date.getFullYear()}_${date.getMonth() + 1}_${expense.transaction_type}`;
        await this.cacheManager.del(cacheKey);
        this.logger.debug(`Cache deleted for key: ${cacheKey}`);
    }
}
