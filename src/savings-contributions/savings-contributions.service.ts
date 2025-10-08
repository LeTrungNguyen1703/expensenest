import {Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import {CreateSavingsContributionDto} from './dto/create-savings-contribution.dto';
import {UpdateSavingsContributionDto} from './dto/update-savings-contribution.dto';
import {PrismaService} from "../prisma/prisma.service";
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {SavingsContributionResponse} from './interfaces/savings-contribution.interface';
import {PrismaPagination} from '../common/helpers/prisma-pagination.helper';
import {PaginatedResponse} from '../common/interfaces/paginated-response.interface';
import {PaginationDto} from '../common/dto/pagination.dto';

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

    /**
     * Admin: list all savings contributions with pagination
     */
    async findAll(paginationDto: PaginationDto): Promise<PaginatedResponse<SavingsContributionResponse>> {
        return PrismaPagination.paginate<SavingsContributionResponse>(
            this.prisma.savings_contributions,
            paginationDto.page,
            paginationDto.limit,
            undefined,
            [
                {contribution_date: 'desc'},
                {created_at: 'desc'},
            ],
        );
    }

    /**
     * List the authenticated user's savings contributions with pagination
     */
    async findByUserId(userId: number, paginationDto: PaginationDto): Promise<PaginatedResponse<SavingsContributionResponse>> {
        return PrismaPagination.paginate<SavingsContributionResponse>(
            this.prisma.savings_contributions,
            paginationDto.page,
            paginationDto.limit,
            {user_id: userId},
            [
                {contribution_date: 'desc'},
                {created_at: 'desc'},
            ],
        );
    }

    async findOne(id: number): Promise<SavingsContributionResponse> {
        const contribution = await this.prisma.savings_contributions.findUnique({
            where: {contribution_id: id},
        });

        if (!contribution) {
            throw new NotFoundException(`Savings contribution with ID ${id} not found`);
        }

        return contribution;
    }

    async update(id: number, updateSavingsContributionDto: UpdateSavingsContributionDto, userId: number): Promise<SavingsContributionResponse> {
        // Verify ownership
        await this.verifyOwnership(id, userId);

        const {contribution_date, ...otherUpdates} = updateSavingsContributionDto as any;
        const dataToUpdate: any = {
            ...otherUpdates,
            updated_at: new Date(),
        };

        if (contribution_date !== undefined) {
            dataToUpdate.contribution_date = contribution_date ? new Date(contribution_date) : null;
        }

        try {
            return await this.prisma.savings_contributions.update({
                where: {contribution_id: id},
                data: dataToUpdate,
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Savings contribution with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    async remove(id: number, userId: number): Promise<{ message: string; contribution: Partial<SavingsContributionResponse> }> {
        // Verify ownership
        await this.verifyOwnership(id, userId);

        try {
            const deleted = await this.prisma.savings_contributions.delete({
                where: {contribution_id: id},
                select: {
                    contribution_id: true,
                    goal_id: true,
                    amount: true,
                    contribution_date: true,
                },
            });

            return {
                message: `Savings contribution ${deleted.contribution_id} has been deleted`,
                contribution: deleted,
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Savings contribution with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    /**
     * Helper to verify ownership. Optionally return selected fields from the record.
     */
    private async verifyOwnership<T extends { user_id?: number }>(contributionId: number, userId: number, select?: any): Promise<T & { user_id?: number }> {
        const existing = await this.prisma.savings_contributions.findUnique({
            where: {contribution_id: contributionId},
            select: select ?? {user_id: true},
        }) as unknown as T & { user_id?: number };

        if (!existing) {
            throw new NotFoundException(`Savings contribution with ID ${contributionId} not found`);
        }

        if (existing.user_id !== userId) {
            throw new BadRequestException('You do not have permission to modify this savings contribution');
        }

        return existing;
    }
}
