import {Injectable, UnauthorizedException} from '@nestjs/common';
import {LoginRequest} from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import {JwtService} from '@nestjs/jwt';
import {JwtPayload} from './interfaces/jwtPayload';
import {UserService} from "../user/user.service";

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UserService,
        private readonly jwtService: JwtService,
    ) {
    }

    async login(user: any) {
        const payload: JwtPayload = {sub: user.id, username: user.username};
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async validateUser(username: string, password: string) {
        const user = await this.usersService.findOneByUsername(username);
        if (!bcrypt.compareSync(password, user.password_hash)) {
            throw new UnauthorizedException('Wrong password');
        }
        return user;
    }
}
