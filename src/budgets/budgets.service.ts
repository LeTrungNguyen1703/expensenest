import {Injectable, NotFoundException, BadRequestException, ConflictException} from '@nestjs/common';
import {CreateBudgetDto} from './dto/create-budget.dto';
import {UpdateBudgetDto} from './dto/update-budget.dto';
import {PrismaService} from "../prisma/prisma.service";
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {BudgetResponse} from './interfaces/budget.interface';
import {PrismaPagination} from '../common/helpers/prisma-pagination.helper';
import {PaginatedResponse} from '../common/interfaces/paginated-response.interface';
import {Prisma} from '@prisma/client';

@Injectable()
export class BudgetsService {
    constructor(private readonly prisma: PrismaService) {
    }

    async create(createBudgetDto: CreateBudgetDto, userId: number): Promise<BudgetResponse> {
        const {start_date, end_date, is_active, ...otherFields} = createBudgetDto;

        try {
            return await this.prisma.budgets.create({
                data: {
                    user_id: userId,
                    ...otherFields,
                    start_date: new Date(start_date),
                    end_date: end_date ? new Date(end_date) : null,
                    is_active: is_active ?? true,
                },
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('User or Category not found');
                }
                if (error.code === 'P2002') {
                    throw new ConflictException('Budget unique constraint violation');
                }
            }
            throw error;
        }
    }

    // Admin: paginated list of all budgets
    async findAll(page = 1, limit = 10): Promise<PaginatedResponse<BudgetResponse>> {
        return PrismaPagination.paginate<BudgetResponse>(
            this.prisma.budgets,
            page,
            limit,
            undefined,
            {created_at: 'desc'},
        );
    }

    async findOne(id: number): Promise<BudgetResponse> {
        const budget = await this.prisma.budgets.findUnique({where: {budget_id: id}});

        if (!budget) {
            throw new NotFoundException(`Budget with ID ${id} not found`);
        }

        return budget;
    }

    // User scoped listing
    async findByUserId(userId: number, page = 1, limit = 10): Promise<PaginatedResponse<BudgetResponse>> {
        return PrismaPagination.paginate<BudgetResponse>(
            this.prisma.budgets,
            page,
            limit,
            {user_id: userId},
            {created_at: 'desc'},
        );
    }

    async findActiveByExpenseCategoryId(categoryId: number): Promise<BudgetResponse[]> {
        return this.prisma.budgets.findMany({
            where: {
                category_id: categoryId,
                is_active: true,
            },
            orderBy: {
                start_date: 'desc',
            },
        });
    }

    async update(
        id: number,
        updateBudgetDto: UpdateBudgetDto,
        userId: number
    ): Promise<BudgetResponse> {
        // Verify ownership
        await this.verifyOwnership(id, userId);

        const {start_date, end_date, ...otherUpdates} = updateBudgetDto;

        const dataToUpdate: Prisma.budgetsUpdateInput = {
            ...otherUpdates,
            updated_at: new Date(),
        };

        // Handle start_date - non-nullable field
        if (start_date !== undefined) {
            if (start_date === null) {
                throw new BadRequestException('start_date cannot be set to null');
            }
            dataToUpdate.start_date = new Date(start_date);
        }

        // Handle end_date - nullable field
        if (end_date !== undefined) {
            // Nếu end_date là null thì set null, ngược lại convert sang Date
            dataToUpdate.end_date = end_date === null
                ? {set: null}
                : new Date(end_date);
        }

        try {
            return await this.prisma.budgets.update({
                where: {budget_id: id},
                data: dataToUpdate,
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                switch (error.code) {
                    case 'P2025':
                        throw new NotFoundException(`Budget with ID ${id} not found`);
                    case 'P2003':
                        throw new NotFoundException('Category or User not found');
                    case 'P2002':
                        throw new ConflictException('Budget update would violate a unique constraint');
                }
            }
            throw error;
        }
    }

    async remove(id: number, userId: number): Promise<{ message: string; budget: Partial<BudgetResponse> }> {
        await this.verifyOwnership(id, userId);

        try {
            const deleted = await this.prisma.budgets.delete({
                where: {budget_id: id},
                select: {
                    budget_id: true,
                    budget_name: true,
                    user_id: true,
                },
            });

            return {
                message: `Budget ${deleted.budget_name} has been deleted`,
                budget: deleted,
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Budget with ID ${id} not found`);
                }
            }
            throw error;
        }
    }


    private async verifyOwnership(budgetId: number, userId: number) {
        const existing = await this.prisma.budgets.findUnique({
            where: {budget_id: budgetId},
            select: {user_id: true},
        });

        if (!existing) {
            throw new NotFoundException(`Budget with ID ${budgetId} not found`);
        }

        if (existing.user_id !== userId) {
            throw new BadRequestException('You do not have permission to modify this budget');
        }
    }
}
