import {Injectable, NotFoundException} from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {PrismaService} from "../prisma/prisma.service";
import {PrismaClientKnownRequestError} from "@prisma/client/runtime/edge";

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService,) {
    }

    create(createUserDto: CreateUserDto) {
        return 'This action adds a new user';
    }

    findAll() {
        return `This action returns all user`;
    }

    findOne(id: number) {
        return `This action returns a #${id} user`;
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        return `This action updates a #${id} user`;
    }

    remove(id: number) {
        return `This action removes a #${id} user`;
    }

    async findOneByUsername(username: string) {
        const user = await this.prisma.users.findUnique({where: {username}});
        if (!user) {
            throw new NotFoundException(`User with username '${username}' not found`);
        }
        return user;
    }
}
