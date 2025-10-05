import {Injectable, NotFoundException, ConflictException} from '@nestjs/common';
import {CreateCategoryDto} from './dto/create-category.dto';
import {UpdateCategoryDto} from './dto/update-category.dto';
import {PrismaService} from '../prisma/prisma.service';
import {PrismaClientKnownRequestError} from '@prisma/client/runtime/library';
import {Category, CategoryResponse} from './interfaces/category.interface';
import {transaction_type_enum} from '@prisma/client';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) {
    }

    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponse> {
        try {
            return await this.prisma.categories.create({
                data: {
                    category_name: createCategoryDto.category_name,
                    transaction_type: createCategoryDto.transaction_type,
                    description: createCategoryDto.description ?? null,
                    user_id: createCategoryDto.user_id ?? null,
                },
                select: {
                    category_id: true,
                    category_name: true,
                    transaction_type: true,
                    description: true,
                    user_id: true,
                    created_at: true,
                },
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new NotFoundException('User not found');
                }
            }
            throw error;
        }
    }

    async findAll(): Promise<CategoryResponse[]> {
        return this.prisma.categories.findMany({
            select: {
                category_id: true,
                category_name: true,
                transaction_type: true,
                description: true,
                user_id: true,
                created_at: true,
            },
            orderBy: {
                category_name: 'asc',
            },
        });
    }

    async findOne(id: number): Promise<CategoryResponse> {
        const category = await this.prisma.categories.findUnique({
            where: {category_id: id},
            select: {
                category_id: true,
                category_name: true,
                transaction_type: true,
                description: true,
                user_id: true,
                created_at: true,
            },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
    }

    async findByUserId(userId: number): Promise<CategoryResponse[]> {
        return this.prisma.categories.findMany({
            where: {user_id: userId},
            select: {
                category_id: true,
                category_name: true,
                transaction_type: true,
                description: true,
                user_id: true,
                created_at: true,
            },
            orderBy: {
                category_name: 'asc',
            },
        });
    }

    async findByType(transactionType: transaction_type_enum): Promise<CategoryResponse[]> {
        return this.prisma.categories.findMany({
            where: {transaction_type: transactionType},
            select: {
                category_id: true,
                category_name: true,
                transaction_type: true,
                description: true,
                user_id: true,
                created_at: true,
            },
            orderBy: {
                category_name: 'asc',
            },
        });
    }

    async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponse> {
        try {
            return await this.prisma.categories.update({
                where: {category_id: id},
                data: updateCategoryDto,
                select: {
                    category_id: true,
                    category_name: true,
                    transaction_type: true,
                    description: true,
                    user_id: true,
                    created_at: true,
                },
            });
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Category with ID ${id} not found`);
                }
                if (error.code === 'P2003') {
                    throw new NotFoundException('User not found');
                }
            }
            throw error;
        }
    }

    async remove(id: number): Promise<{ message: string; category: Partial<CategoryResponse> }> {
        try {
            const deletedCategory = await this.prisma.categories.delete({
                where: {category_id: id},
                select: {
                    category_id: true,
                    category_name: true,
                    transaction_type: true,
                },
            });

            return {
                message: `Category ${deletedCategory.category_name} has been deleted`,
                category: deletedCategory,
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`Category with ID ${id} not found`);
                }
                if (error.code === 'P2003') {
                    throw new ConflictException('Cannot delete category that is being used in budgets, expenses, or recurring transactions');
                }
            }
            throw error;
        }
    }
}
