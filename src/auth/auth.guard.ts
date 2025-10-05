// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { jwtConstants } from './constants';
// import { ConfigService } from '@nestjs/config';
//
// @Injectable()
// export class AuthGuard implements CanActivate {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly configService: ConfigService,
//   ) {}
//
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const token = this.extractTokenFromHeader(request);
//     if (!token) {
//       throw new UnauthorizedException('Invalid token');
//     }
//     const jwtKey = this.configService.get<string>('secret');
//     console.log(jwtKey);
//     try {
//       request['user'] = await this.jwtService.verifyAsync(token, {
//         secret: jwtKey,
//       });
//     } catch (error) {
//       throw new UnauthorizedException('Missing credentials');
//     }
//
//     return true;
//   }
//
//   private extractTokenFromHeader(request: Request): string | undefined {
//     const authHeader = request.headers['authorization'];
//     if (!authHeader) return undefined;
//     const [type, token] = authHeader.split(' ');
//     return type === 'Bearer' ? token : undefined;
//   }
// }
