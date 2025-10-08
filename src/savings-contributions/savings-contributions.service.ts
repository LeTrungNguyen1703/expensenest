import {Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import {CreateSavingsContributionDto} from './dto/create-savings-contribution.dto';
import {UpdateSavingsContributionDto} from './dto/update-savings-contribution.dto';
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class SavingsContributionsService {
    constructor(private readonly prisma: PrismaService) {
    }

    /**
     * Create a savings contribution and update the linked savings goal atomically.
     * Verifies the authenticated user owns the goal.
     */
    async create(createSavingsContributionDto: CreateSavingsContributionDto, userId: number) {
        const {goal_id, amount, notes} = createSavingsContributionDto;

        // Fetch goal and verify ownership
        const goal = await this.prisma.savings_goals.findUnique({
            where: {goal_id},
            select: {
                goal_id: true,
                user_id: true,
                current_amount: true,
                target_amount: true,
                status: true,
            },
        });

        if (!goal) {
            throw new NotFoundException(`Savings goal with ID ${goal_id} not found`);
        }

        if (goal.user_id !== userId) {
            throw new BadRequestException('You do not have permission to contribute to this savings goal');
        }

        // Compute new amount and determine if goal will be completed
        const current = goal.current_amount ?? 0;
        const target = goal.target_amount ?? Number.POSITIVE_INFINITY;
        const newAmount = current + amount;
        const willComplete = newAmount >= target;

        // Run transaction: create contribution, update savings goal
        const [createdContribution, updatedGoal] = await this.prisma.$transaction([
            this.prisma.savings_contributions.create({
                data: {
                    goal_id,
                    amount,
                    notes: notes ?? null,
                    user_id: userId,
                },
            }),
            this.prisma.savings_goals.update({
                where: {goal_id},
                data: {
                    current_amount: newAmount,
                    status: willComplete ? 'COMPLETED' : undefined,
                    completed_at: willComplete ? new Date() : undefined,
                    updated_at: new Date(),
                },
            }),
        ]);

        return {
            contribution: createdContribution,
            updatedGoal,
        };
    }

    findAll() {
        return `This action returns all savingsContributions`;
    }

    findOne(id: number) {
        return `This action returns a #${id} savingsContribution`;
    }

    update(id: number, updateSavingsContributionDto: UpdateSavingsContributionDto) {
        // Use the DTO in the message to avoid unused-parameter warnings and to give a hint
        return `This action updates a #${id} savingsContribution with ${JSON.stringify(updateSavingsContributionDto)}`;
    }

    remove(id: number) {
        return `This action removes a #${id} savingsContribution`;
    }
}
