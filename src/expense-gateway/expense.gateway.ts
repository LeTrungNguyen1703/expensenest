import {OnModuleInit, Logger} from '@nestjs/common';
import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {JwtService} from '@nestjs/jwt';
import {OnEvent} from "@nestjs/event-emitter";
import {EVENTS, SOCKET_EVENTS} from "../common/constants/events.constants";
import {ExpenseResponse} from "../expenses/interfaces/expense.interface";
import {RecurringTransactionResponse} from "../recurring-transactions/interfaces/recurring-transaction.interface";

@WebSocketGateway({cors: true})
export class ExpenseGateway implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ExpenseGateway.name);
    private clients = new Set<string>();

    @WebSocketServer()
    server: Server;

    constructor(private readonly jwtService: JwtService) {
    }

    onModuleInit() {
        this.logger.log('ExpenseGateway initialized');
    }

    // Simplified connection handler: read token from socket.auth, verify, attach userId
    async handleConnection(client: Socket, ...args: any[]) {
        // Expect token in client.handshake.auth.token (socket.io client auth option)
        const token = client.handshake?.auth && (client.handshake.auth['token'] as string | undefined);

        if (!token) {
            this.logger.warn(`Unauthorized connection attempt (no token) from ${client.id}`);
            try { client.emit('unauthorized', { message: 'No token provided' }); } catch (e) { /* ignore */ }
            client.disconnect(true);
            return;
        }

        try {
            const payload = await this.jwtService.verifyAsync(token);

            // Attach payload and userId to socket for later use
            (client as any).data = (client as any).data || {};
            (client as any).data.user = payload;
            (client as any).data.userId = (payload && (payload.sub ?? payload.user_id)) ?? null;

            // Track connected client
            this.clients.add(client.id);
            this.logger.log(`Client connected: ${client.id} (userId: ${(client as any).data.userId}) (total: ${this.clients.size})`);

            client.join(`user:${(client as any).data.userId}`); // Join room for user-specific events

            // Notify client
            try { client.emit('connected', { clientId: client.id, userId: (client as any).data.userId }); } catch (e) { /* ignore */ }
        } catch (err) {
            this.logger.warn(`Unauthorized connection attempt (invalid token) from ${client.id}: ${err?.message || err}`);
            try { client.emit('unauthorized', { message: 'Invalid token' }); } catch (e) { /* ignore */ }
            client.disconnect(true);
            return;
        }
    }

    handleDisconnect(client: Socket) {
        this.clients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id} (total: ${this.clients.size})`);
    }

    @SubscribeMessage('message')
    handleMessage(client: Socket, payload: any) {
        this.logger.debug(`Received message from ${client.id}: ${JSON.stringify(payload)}`);

        // Broadcast the message to all connected clients
        this.server.emit('message', {from: client.id, payload});

        // Optionally return an acknowledgement
        return {event: 'message', data: {from: client.id, payload}};
    }

    @OnEvent(EVENTS.RECURRING_EXPENSE.EXECUTED)
    handleNewRecurringExpense(recurringTransactionResponse: RecurringTransactionResponse) {
        const {user_id, ...result} = recurringTransactionResponse;
        this.logger.debug(`Executed recurringTrans event: ${JSON.stringify(result)}`);
        this.server.to(`user:${user_id}`).emit(SOCKET_EVENTS.RECURRING_EXPENSE.EXECUTED, result);
    }

    @OnEvent(EVENTS.EXPENSE.CREATED)
    handleNewExpense(expenseResponse: ExpenseResponse) {
        const {user_id, ...result} = expenseResponse;
        this.logger.debug(`New expense event: ${JSON.stringify(result)}`);
        this.server.to(`user:${user_id}`).emit(SOCKET_EVENTS.EXPENSE.CREATED, result);
    }
}
