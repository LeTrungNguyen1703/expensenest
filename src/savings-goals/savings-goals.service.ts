import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SavingsGoal, SavingsGoalResponse } from './interfaces/savings-goal.interface';
import { goal_status_enum } from '@prisma/client';

@Injectable()
export class SavingsGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSavingsGoalDto: CreateSavingsGoalDto, userId: number): Promise<SavingsGoalResponse> {
    try {
      return await this.prisma.savings_goals.create({
        data: {
          user_id: userId,
          goal_name: createSavingsGoalDto.goal_name,
          description: createSavingsGoalDto.description ?? null,
          target_amount: createSavingsGoalDto.target_amount,
          current_amount: createSavingsGoalDto.current_amount ?? 0,
          target_date: createSavingsGoalDto.target_date ? new Date(createSavingsGoalDto.target_date) : null,
          priority: createSavingsGoalDto.priority ?? 0,
          icon: createSavingsGoalDto.icon ?? null,
          color: createSavingsGoalDto.color ?? null,
          wallet_id: createSavingsGoalDto.wallet_id ?? null,
          status: createSavingsGoalDto.status ?? goal_status_enum.ACTIVE,
          is_recurring: createSavingsGoalDto.is_recurring ?? false,
        },
        select: {
          goal_id: true,
          user_id: true,
          goal_name: true,
          description: true,
          target_amount: true,
          current_amount: true,
          target_date: true,
          priority: true,
          icon: true,
          color: true,
          wallet_id: true,
          status: true,
          is_recurring: true,
          created_at: true,
          updated_at: true,
          completed_at: true,
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
      select: {
        goal_id: true,
        user_id: true,
        goal_name: true,
        description: true,
        target_amount: true,
        current_amount: true,
        target_date: true,
        priority: true,
        icon: true,
        color: true,
        wallet_id: true,
        status: true,
        is_recurring: true,
        created_at: true,
        updated_at: true,
        completed_at: true,
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }

  async findOne(id: number): Promise<SavingsGoalResponse> {
    const goal = await this.prisma.savings_goals.findUnique({
      where: { goal_id: id },
      select: {
        goal_id: true,
        user_id: true,
        goal_name: true,
        description: true,
        target_amount: true,
        current_amount: true,
        target_date: true,
        priority: true,
        icon: true,
        color: true,
        wallet_id: true,
        status: true,
        is_recurring: true,
        created_at: true,
        updated_at: true,
        completed_at: true,
      },
    });

    if (!goal) {
      throw new NotFoundException(`Savings goal with ID ${id} not found`);
    }

    return goal;
  }

  async findByUserId(userId: number): Promise<SavingsGoalResponse[]> {
    return this.prisma.savings_goals.findMany({
      where: { user_id: userId },
      select: {
        goal_id: true,
        user_id: true,
        goal_name: true,
        description: true,
        target_amount: true,
        current_amount: true,
        target_date: true,
        priority: true,
        icon: true,
        color: true,
        wallet_id: true,
        status: true,
        is_recurring: true,
        created_at: true,
        updated_at: true,
        completed_at: true,
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }

  async findByStatus(userId: number, status: goal_status_enum): Promise<SavingsGoalResponse[]> {
    return this.prisma.savings_goals.findMany({
      where: {
        user_id: userId,
        status: status
      },
      select: {
        goal_id: true,
        user_id: true,
        goal_name: true,
        description: true,
        target_amount: true,
        current_amount: true,
        target_date: true,
        priority: true,
        icon: true,
        color: true,
        wallet_id: true,
        status: true,
        is_recurring: true,
        created_at: true,
        updated_at: true,
        completed_at: true,
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }

  async update(id: number, updateSavingsGoalDto: UpdateSavingsGoalDto, userId: number): Promise<SavingsGoalResponse> {
    // Verify ownership
    const existingGoal = await this.prisma.savings_goals.findUnique({
      where: { goal_id: id },
      select: { user_id: true },
    });

    if (!existingGoal) {
      throw new NotFoundException(`Savings goal with ID ${id} not found`);
    }

    if (existingGoal.user_id !== userId) {
      throw new BadRequestException('You do not have permission to update this goal');
    }

    const dataToUpdate: any = {};

    if (updateSavingsGoalDto.goal_name !== undefined) dataToUpdate.goal_name = updateSavingsGoalDto.goal_name;
    if (updateSavingsGoalDto.description !== undefined) dataToUpdate.description = updateSavingsGoalDto.description;
    if (updateSavingsGoalDto.target_amount !== undefined) dataToUpdate.target_amount = updateSavingsGoalDto.target_amount;
    if (updateSavingsGoalDto.current_amount !== undefined) dataToUpdate.current_amount = updateSavingsGoalDto.current_amount;
    if (updateSavingsGoalDto.target_date !== undefined) dataToUpdate.target_date = updateSavingsGoalDto.target_date ? new Date(updateSavingsGoalDto.target_date) : null;
    if (updateSavingsGoalDto.priority !== undefined) dataToUpdate.priority = updateSavingsGoalDto.priority;
    if (updateSavingsGoalDto.icon !== undefined) dataToUpdate.icon = updateSavingsGoalDto.icon;
    if (updateSavingsGoalDto.color !== undefined) dataToUpdate.color = updateSavingsGoalDto.color;
    if (updateSavingsGoalDto.wallet_id !== undefined) dataToUpdate.wallet_id = updateSavingsGoalDto.wallet_id;
    if (updateSavingsGoalDto.status !== undefined) {
      dataToUpdate.status = updateSavingsGoalDto.status;
      if (updateSavingsGoalDto.status === goal_status_enum.COMPLETED) {
        dataToUpdate.completed_at = new Date();
      }
    }
    if (updateSavingsGoalDto.is_recurring !== undefined) dataToUpdate.is_recurring = updateSavingsGoalDto.is_recurring;

    dataToUpdate.updated_at = new Date();

    try {
      return await this.prisma.savings_goals.update({
        where: { goal_id: id },
        data: dataToUpdate,
        select: {
          goal_id: true,
          user_id: true,
          goal_name: true,
          description: true,
          target_amount: true,
          current_amount: true,
          target_date: true,
          priority: true,
          icon: true,
          color: true,
          wallet_id: true,
          status: true,
          is_recurring: true,
          created_at: true,
          updated_at: true,
          completed_at: true,
        },
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
      where: { goal_id: id },
      select: { user_id: true, goal_name: true },
    });

    if (!existingGoal) {
      throw new NotFoundException(`Savings goal with ID ${id} not found`);
    }

    if (existingGoal.user_id !== userId) {
      throw new BadRequestException('You do not have permission to delete this goal');
    }

    try {
      const deletedGoal = await this.prisma.savings_goals.delete({
        where: { goal_id: id },
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
      where: { goal_id: id },
      select: { user_id: true, current_amount: true, target_amount: true },
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
        where: { goal_id: id },
        data: dataToUpdate,
        select: {
          goal_id: true,
          user_id: true,
          goal_name: true,
          description: true,
          target_amount: true,
          current_amount: true,
          target_date: true,
          priority: true,
          icon: true,
          color: true,
          wallet_id: true,
          status: true,
          is_recurring: true,
          created_at: true,
          updated_at: true,
          completed_at: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
