import {Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import {CreateSavingsGoalDto} from './dto/create-savings-goal.dto';
import {UpdateSavingsGoalDto} from './dto/update-savings-goal.dto';
import {PrismaService} from '../prisma/prisma.service';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {SavingsGoalResponse} from './interfaces/savings-goal.interface';
import {goal_status_enum} from '@prisma/client';
import {PrismaPagination} from '../common/helpers/prisma-pagination.helper';
import {PaginatedResponse} from '../common/interfaces/paginated-response.interface';
import {EventEmitter2} from "@nestjs/event-emitter";
import {EVENTS} from "../common/constants/events.constants";

@Injectable()
export class SavingsGoalsService {
    constructor(private readonly prisma: PrismaService, private readonly emitter: EventEmitter2) {
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

    async updateProgress(id: number, amount: number, userId: number): Promise<SavingsGoalResponse> {
        // Verify ownership and fetch current/target amounts
        const existingGoal = await this.verifyOwnership(
            id,
            userId,
            {user_id: true, current_amount: true, target_amount: true},
        );

        const newAmount = (existingGoal.current_amount ?? 0) + amount;
        const dataToUpdate: any = {
            current_amount: newAmount,
            updated_at: new Date(),
        };


        // Auto-complete if target reached
        if (newAmount >= (existingGoal.target_amount ?? 0)) {
            dataToUpdate.status = goal_status_enum.COMPLETED;
            dataToUpdate.completed_at = new Date();

            const dataToEmit = {
                goal_id: existingGoal.goal_id,
                goal_name: existingGoal.goal_name,
                user_id: existingGoal.user_id,
                current_amount: newAmount,
                target_amount: existingGoal.target_amount,
                completed_at: dataToUpdate.completed_at
            }
            this.emitter.emit(EVENTS.SAVINGS_GOAL.COMPLETE, {dataToEmit})
        }

        try {
            return await this.prisma.savings_goals.update({
                where: {goal_id: id},
                data: dataToUpdate,
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Helper to verify ownership. Optionally return selected fields from the record.
     */
    private async verifyOwnership(goalId: number, userId: number, select?: any): Promise<SavingsGoalResponse> {
        const existing = await this.prisma.savings_goals.findUnique({
            where: {goal_id: goalId},
        })

        if (!existing) {
            throw new NotFoundException(`Savings goal with ID ${goalId} not found`);
        }

        if (existing.user_id !== userId) {
            throw new BadRequestException('You do not have permission to modify this savings goal');
        }

        return existing;
    }
}
