import {Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import {CreateSavingsGoalDto} from './dto/create-savings-goal.dto';
import {UpdateSavingsGoalDto} from './dto/update-savings-goal.dto';
import {PrismaService} from '../prisma/prisma.service';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {SavingsGoalResponse} from './interfaces/savings-goal.interface';
import {goal_status_enum} from '@prisma/client';

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

    async findAll(): Promise<SavingsGoalResponse[]> {
        return this.prisma.savings_goals.findMany({
            orderBy: [
                {priority: 'desc'},
                {created_at: 'desc'},
            ],
        });
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

    async findByUserId(userId: number): Promise<SavingsGoalResponse[]> {
        return this.prisma.savings_goals.findMany({
            where: {user_id: userId},
            orderBy: [
                {priority: 'desc'},
                {created_at: 'desc'},
            ],
        });
    }

    async findByStatus(userId: number, status: goal_status_enum): Promise<SavingsGoalResponse[]> {
        return this.prisma.savings_goals.findMany({
            where: {
                user_id: userId,
                status: status
            },
            orderBy: [
                {priority: 'desc'},
                {created_at: 'desc'},
            ],
        });
    }

    async update(id: number, updateSavingsGoalDto: UpdateSavingsGoalDto, userId: number): Promise<SavingsGoalResponse> {
        // Verify ownership
        const existingGoal = await this.prisma.savings_goals.findUnique({
            where: {goal_id: id},
            select: {user_id: true},
        });

        if (!existingGoal) {
            throw new NotFoundException(`Savings goal with ID ${id} not found`);
        }

        if (existingGoal.user_id !== userId) {
            throw new BadRequestException('You do not have permission to update this goal');
        }

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
        const existingGoal = await this.prisma.savings_goals.findUnique({
            where: {goal_id: id},
            select: {user_id: true, goal_name: true},
        });

        if (!existingGoal) {
            throw new NotFoundException(`Savings goal with ID ${id} not found`);
        }

        if (existingGoal.user_id !== userId) {
            throw new BadRequestException('You do not have permission to delete this goal');
        }

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
        // Verify ownership
        const existingGoal = await this.prisma.savings_goals.findUnique({
            where: {goal_id: id},
            select: {user_id: true, current_amount: true, target_amount: true},
        });

        if (!existingGoal) {
            throw new NotFoundException(`Savings goal with ID ${id} not found`);
        }

        if (existingGoal.user_id !== userId) {
            throw new BadRequestException('You do not have permission to update this goal');
        }

        const newAmount = (existingGoal.current_amount ?? 0) + amount;
        const dataToUpdate: any = {
            current_amount: newAmount,
            updated_at: new Date(),
        };

        // Auto-complete if target reached
        if (newAmount >= existingGoal.target_amount) {
            dataToUpdate.status = goal_status_enum.COMPLETED;
            dataToUpdate.completed_at = new Date();
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
}
