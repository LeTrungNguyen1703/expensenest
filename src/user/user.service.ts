import {Injectable, ConflictException, NotFoundException} from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {PrismaService} from "../prisma/prisma.service";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library";
import * as bcrypt from 'bcrypt';
import {User, UserResponse} from './interfaces/user.interface';

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

    async findAll(): Promise<UserResponse[]> {
        return this.prisma.users.findMany({
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

    async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponse> {
        const {password, ...updateData} = updateUserDto;

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

    async remove(id: number): Promise<{ message: string; user: Partial<UserResponse> }> {
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
}
