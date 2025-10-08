import {Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import {CreateSavingsGoalDto} from './dto/create-savings-goal.dto';
import {UpdateSavingsGoalDto} from './dto/update-savings-goal.dto';
import {PrismaService} from '../prisma/prisma.service';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {SavingsGoalResponse} from './interfaces/savings-goal.interface';
import {goal_status_enum} from '@prisma/client';
import {PrismaPagination} from '../common/helpers/prisma-pagination.helper';
import {PaginatedResponse} from '../common/interfaces/paginated-response.interface';

@Injectable()
export class SavingsGoalsService {
    constructor(private readonly prisma: PrismaService) {
    }

    async create(createSavingsGoalDto: CreateSavingsGoalDto, userId: number): Promise<SavingsGoalResponse> {
        const {target_date, ...otherFields} = createSavingsGoalDto;

        try {
            return await this.prisma.savings_goals.create({
                data: {
                    user_id: userId,
                    ...otherFields,
                    target_date: target_date ? new Date(target_date) : null,
                    current_amount: createSavingsGoalDto.current_amount ?? 0,
                    priority: createSavingsGoalDto.priority ?? 0,
                    status: createSavingsGoalDto.status ?? goal_status_enum.ACTIVE,
                    is_recurring: createSavingsGoalDto.is_recurring ?? false,
                },
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('User or Wallet not found');
                }
            }
            throw error;
        }
    }

    /**
     * Admin: list all savings goals with pagination
     */
    async findAll(page = 1, limit = 10): Promise<PaginatedResponse<SavingsGoalResponse>> {
        const select = undefined; // return full record matching response class
        return PrismaPagination.paginate<SavingsGoalResponse>(
            this.prisma.savings_goals,
            page,
            limit,
            undefined,
            [
                {priority: 'desc'},
                {created_at: 'desc'},
            ],
            undefined,
            select,
        );
    }

    async findOne(id: number): Promise<SavingsGoalResponse> {
        const goal = await this.prisma.savings_goals.findUnique({
            where: {goal_id: id},
        });

        if (!goal) {
            throw new NotFoundException(`Savings goal with ID ${id} not found`);
        }

        return goal;
    }

    /**
     * List user's savings goals with pagination
     */
    async findByUserId(userId: number, page = 1, limit = 10): Promise<PaginatedResponse<SavingsGoalResponse>> {
        return PrismaPagination.paginate<SavingsGoalResponse>(
            this.prisma.savings_goals,
            page,
            limit,
            {user_id: userId},
            [
                {priority: 'desc'},
                {created_at: 'desc'},
            ],
        );
    }

    /**
     * List by status (user scoped) with pagination
     */
    async findByStatus(userId: number, status: goal_status_enum, page = 1, limit = 10): Promise<PaginatedResponse<SavingsGoalResponse>> {
        return PrismaPagination.paginate<SavingsGoalResponse>(
            this.prisma.savings_goals,
            page,
            limit,
            {
                user_id: userId,
                status: status,
            },
            [
                {priority: 'desc'},
                {created_at: 'desc'},
            ],
        );
    }

    async update(id: number, updateSavingsGoalDto: UpdateSavingsGoalDto, userId: number): Promise<SavingsGoalResponse> {
        // Verify ownership
        await this.verifyOwnership(id, userId);

        const {target_date, status, ...otherUpdates} = updateSavingsGoalDto;
        const dataToUpdate: any = {
            ...otherUpdates,
            updated_at: new Date(),
        };

        // Handle special fields separately
        if (target_date !== undefined) {
            dataToUpdate.target_date = target_date ? new Date(target_date) : null;
        }

        if (status !== undefined) {
            dataToUpdate.status = status;
            if (status === goal_status_enum.COMPLETED) {
                dataToUpdate.completed_at = new Date();
            }
        }

        try {
            return await this.prisma.savings_goals.update({
                where: {goal_id: id},
                data: dataToUpdate,
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('Wallet not found');
                }
            }
            throw error;
        }
    }

    async remove(id: number, userId: number): Promise<{ message: string; goal: Partial<SavingsGoalResponse> }> {
        // Verify ownership
        await this.verifyOwnership(id, userId);

        try {
            const deletedGoal = await this.prisma.savings_goals.delete({
                where: {goal_id: id},
                select: {
                    goal_id: true,
                    goal_name: true,
                    target_amount: true,
                    current_amount: true,
                },
            });

            return {
                message: `Savings goal ${deletedGoal.goal_name} has been deleted`,
                goal: deletedGoal,
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Savings goal with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    /**
     * Helper to verify ownership. Optionally return selected fields from the record.
     */
    private async verifyOwnership<T extends { user_id?: number }>(goalId: number, userId: number, select?: any): Promise<T & { user_id?: number }> {
        const existing = await this.prisma.savings_goals.findUnique({
            where: {goal_id: goalId},
            select: select ?? {user_id: true},
        }) as unknown as T & { user_id?: number };

        if (!existing) {
            throw new NotFoundException(`Savings goal with ID ${goalId} not found`);
        }

        if (existing.user_id !== userId) {
            throw new BadRequestException('You do not have permission to modify this savings goal');
        }

        return existing;
    }
}
