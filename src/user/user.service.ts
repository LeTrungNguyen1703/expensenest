import {Injectable, ConflictException, NotFoundException, BadRequestException} from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {PrismaService} from "../prisma/prisma.service";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import * as bcrypt from 'bcrypt';
import {User, UserResponse} from './interfaces/user.interface';
import {PrismaPagination} from '../common/helpers/prisma-pagination.helper';
import {PaginatedResponse} from '../common/interfaces/paginated-response.interface';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {
    }

    async create(createUserDto: CreateUserDto): Promise<UserResponse> {
        const {password, ...userData} = createUserDto;

        // Hash the password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        try {
            // Create the user with hashed password
            return await this.prisma.users.create({
                data: {
                    ...userData,
                    password_hash: hashedPassword,
                },
                select: {
                    user_id: true,
                    username: true,
                    email: true,
                    full_name: true,
                    created_at: true,
                    is_active: true,
                }
            });

        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') { // Unique constraint violation
                    throw new ConflictException('Username or email already exists');
                }
            }
            throw error;
        }
    }

    /**
     * Paginated list of users (admin)
     */
    async findAll(page = 1, limit = 10): Promise<PaginatedResponse<UserResponse>> {
        // Select only public fields (exclude password_hash)
        const select = {
            user_id: true,
            username: true,
            email: true,
            full_name: true,
            created_at: true,
            updated_at: true,
            is_active: true,
        };

        return PrismaPagination.paginate<UserResponse>(
            this.prisma.users,
            page,
            limit,
            undefined,
            { created_at: 'desc' },
            undefined,
            select,
        );
    }

    async findOne(id: number): Promise<UserResponse> {
        const user = await this.prisma.users.findUnique({
            where: {user_id: id},
            select: {
                user_id: true,
                username: true,
                email: true,
                full_name: true,
                created_at: true,
                updated_at: true,
                is_active: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    /**
     * Update user with ownership verification (only the owner can update their profile)
     */
    async update(id: number, updateUserDto: UpdateUserDto, userId: number): Promise<UserResponse> {
        const {password, ...updateData} = updateUserDto;

        // Verify ownership
        await this.verifyOwnership(id, userId);

        // If password is provided, hash it
        let dataToUpdate: any = {...updateData};
        if (password) {
            const salt = await bcrypt.genSalt();
            dataToUpdate.password_hash = await bcrypt.hash(password, salt);
        }

        try {
            return await this.prisma.users.update({
                where: {user_id: id},
                data: {
                    ...dataToUpdate,
                    updated_at: new Date(),
                },
                select: {
                    user_id: true,
                    username: true,
                    email: true,
                    full_name: true,
                    created_at: true,
                    updated_at: true,
                    is_active: true,
                },
            });

        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`User with ID ${id} not found`);
                }
                if (error.code === 'P2002') {
                    throw new ConflictException('Username or email already exists');
                }
            }
            throw error;
        }
    }

    /**
     * Remove user with ownership verification
     */
    async remove(id: number, userId: number): Promise<{ message: string; user: Partial<UserResponse> }> {
        // Verify ownership
        await this.verifyOwnership(id, userId);

        try {
            const deletedUser = await this.prisma.users.delete({
                where: {user_id: id},
                select: {
                    user_id: true,
                    username: true,
                    email: true,
                },
            });

            return {
                message: `User ${deletedUser.username} has been deleted`,
                user: deletedUser,
            };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException(`User with ID ${id} not found`);
                }
            }
            throw error;
        }
    }

    async findOneByUsername(username: string): Promise<User> {
        const user = await this.prisma.users.findUnique({
            where: {username},
            select: {
                user_id: true,
                username: true,
                email: true,
                password_hash: true,
                full_name: true,
                is_active: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with username '${username}' not found`);
        }

        return user;
    }

    /**
     * Helper to verify that JWT userId owns the resource
     */
    private async verifyOwnership(targetUserId: number, jwtUserId: number) {
        const existing = await this.prisma.users.findUnique({
            where: {user_id: targetUserId},
            select: {user_id: true},
        });

        if (!existing) {
            throw new NotFoundException(`User with ID ${targetUserId} not found`);
        }

        if (existing.user_id !== jwtUserId) {
            throw new BadRequestException('You do not have permission to modify this user');
        }
    }
}
