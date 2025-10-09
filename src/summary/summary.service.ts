import {Inject, Injectable, Logger} from '@nestjs/common';
import {UpdateSummaryDto} from './dto/update-summary.dto';
import {PrismaService} from "../prisma/prisma.service";
import {transaction_type_enum} from "@prisma/client";
import {SummaryResponse} from "./dto/response-summary.dto";
import {CACHE_MANAGER, Cache} from "@nestjs/cache-manager";

@Injectable()
export class SummaryService {
    private logger = new Logger(SummaryService.name);

    constructor(private readonly prisma: PrismaService,
                @Inject(CACHE_MANAGER) private cacheManager: Cache
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
        await this.cacheManager.set(cacheKey, summary, 1800); // Cache for 30 minutes
        this.logger.debug(`Cache set for key: ${cacheKey} with 30 minutes TTL`);

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

}
