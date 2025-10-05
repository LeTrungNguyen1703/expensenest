import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard extends AuthGuard('jwt') implements CanActivate {
  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    // Extract token from handshake data or other means
    const token = client.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new WsException('Unauthorized');
    }
    return { headers: { authorization: `Bearer ${token}` } };
  }
}
