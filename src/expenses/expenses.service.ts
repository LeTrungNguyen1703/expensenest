import {Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import {CreateExpenseDto} from './dto/create-expense.dto';
import {UpdateExpenseDto} from './dto/update-expense.dto';
import {PrismaService} from '../prisma/prisma.service';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {Expense, ExpenseResponse} from './interfaces/expense.interface';
import {transaction_type_enum} from '@prisma/client';
import {EventEmitter2} from "@nestjs/event-emitter";
import {EVENTS} from "../common/constants/events.constants";

@Injectable()
export class ExpensesService {
    constructor(private readonly prisma: PrismaService, private readonly emitter: EventEmitter2) {
    }

    async create(createExpenseDto: CreateExpenseDto, userId: number): Promise<ExpenseResponse> {
        const {expense_date, category_id, ...otherFields} = createExpenseDto;

        try {
            const expense = await this.prisma.expenses.create({
                data: {
                    user_id: userId,
                    category_id: category_id,
                    ...otherFields,
                    expense_date: new Date(expense_date),
                },
            });
            this.emitter.emit(EVENTS.EXPENSE.CREATED, expense);
            return expense;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('Category, Wallet, or Recurring Transaction not found');
                }
            }
            throw error;
        }
    }

    async findAll(): Promise<ExpenseResponse[]> {
        return this.prisma.expenses.findMany({
            orderBy: {
                expense_date: 'desc',
            },
        });
    }

    async findOne(id: number): Promise<ExpenseResponse> {
        const expense = await this.prisma.expenses.findUnique({
            where: {expense_id: id}
        });

        if (!expense) {
            throw new NotFoundException(`Expense with ID ${id} not found`);
        }

        return expense;
    }


    async findByUserId(userId: number): Promise<ExpenseResponse[]> {
        return this.prisma.expenses.findMany({
            where: {user_id: userId},
            orderBy: {
                expense_date: 'desc',
            },
        });
    }

    async findByType(userId: number, type: transaction_type_enum): Promise<ExpenseResponse[]> {
        return this.prisma.expenses.findMany({
            where: {
                user_id: userId,
                transaction_type: type
            },
            orderBy: {
                expense_date: 'desc',
            },
        });
    }

    async findByCategory(userId: number, categoryId: number): Promise<ExpenseResponse[]> {
        return this.prisma.expenses.findMany({
            where: {
                user_id: userId,
                category_id: categoryId
            },
            orderBy: {
                expense_date: 'desc',
            },
        });
    }

    async findByWallet(userId: number, walletId: number): Promise<ExpenseResponse[]> {
        return this.prisma.expenses.findMany({
            where: {
                user_id: userId,
                wallet_id: walletId
            },
            orderBy: {
                expense_date: 'desc',
            },
        });
    }

    async findByDateRange(userId: number, startDate: string, endDate: string): Promise<ExpenseResponse[]> {
        return this.prisma.expenses.findMany({
            where: {
                user_id: userId,
                expense_date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                }
            },
            orderBy: {
                expense_date: 'desc',
            },
        });
    }

    async update(id: number, updateExpenseDto: UpdateExpenseDto, userId: number): Promise<ExpenseResponse> {
        // Verify ownership
        const existing = await this.prisma.expenses.findUnique({
            where: {expense_id: id},
            select: {user_id: true},
        });

        if (!existing) {
            throw new NotFoundException(`Expense with ID ${id} not found`);
        }

        if (existing.user_id !== userId) {
            throw new BadRequestException('You do not have permission to update this expense');
        }

        // Prepare update data
        const {expense_date, ...otherUpdates} = updateExpenseDto;
        const dataToUpdate: any = {
            ...otherUpdates,
            updated_at: new Date(),
        };

        // Handle date conversion
        if (expense_date !== undefined) {
            dataToUpdate.expense_date = new Date(expense_date);
        }

        try {
            const expenseUpdated = await this.prisma.expenses.update({
                where: {expense_id: id},
                data: dataToUpdate,
            });
            this.emitter.emit(EVENTS.EXPENSE.UPDATED, expenseUpdated);
            return expenseUpdated;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('Category, Wallet, or Recurring Transaction not found');
                }
            }
            throw error;
        }
    }

    async remove(id: number, userId: number): Promise<{ message: string; expense: Partial<ExpenseResponse> }> {
        // Verify ownership
        const existing = await this.prisma.expenses.findUnique({
            where: {expense_id: id},
        });

        this.emitter.emit(EVENTS.EXPENSE.DELETED, existing);

        if (!existing) {
            throw new NotFoundException(`Expense with ID ${id} not found`);
        }

        if (existing.user_id !== userId) {
            throw new BadRequestException('You do not have permission to delete this expense');
        }

        try {
            const deleted = await this.prisma.expenses.delete({
                where: {expense_id: id},
                select: {
                    expense_id: true,
                    title: true,
                    amount: true,
                    expense_date: true,
                },
            });

            return {
                message: `Expense ${deleted.title} has been deleted`,
                expense: deleted,
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Expense with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    async getTotalByType(userId: number, type: transaction_type_enum, startDate?: string, endDate?: string): Promise<{
        total: number
    }> {
        const whereCondition: any = {
            user_id: userId,
            transaction_type: type,
        };

        if (startDate && endDate) {
            whereCondition.expense_date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const result = await this.prisma.expenses.aggregate({
            where: whereCondition,
            _sum: {
                amount: true,
            },
        });

        return {total: result._sum.amount || 0};
    }
}
