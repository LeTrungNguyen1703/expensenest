import {Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit} from "@nestjs/common";
import * as Ably from 'ably';
import {RealtimeChannel} from "ably";
import {OnEvent} from "@nestjs/event-emitter";
import {EVENTS} from "../common/constants/events.constants";
import {ExpenseResponse} from "../expenses/interfaces/expense.interface";
import {RecurringTransactionResponse} from "../recurring-transactions/interfaces/recurring-transaction.interface";

@Injectable()
export class AblyGateway implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(AblyGateway.name);
    private expenseChannel: RealtimeChannel;
    private notificationChannel: RealtimeChannel;

    constructor(
        @Inject('ABLY_CLIENT') private readonly ablyClient: Ably.Realtime
    ) {
    }

    async onModuleDestroy() {
        this.logger.log('🛑 Closing Ably connection...');
        this.ablyClient.close();
    }

    onModuleInit() {
        this.logger.log('🚀 Initializing Ably Gateway...');

        // Tạo channels
        this.expenseChannel = this.ablyClient.channels.get('expenses');
        this.notificationChannel = this.ablyClient.channels.get('notifications');

        this.logger.log('✅ Ably Gateway initialized');
    }

    @OnEvent(EVENTS.EXPENSE.CREATED)
    async handleExpenseCreated(expense: ExpenseResponse) {
        this.logger.debug(`📤 Publishing expense.created: #${expense.expense_id}`);

        const {user_id, ...expenseData} = expense;

        try {
            // Publish to channel với data cho USER CỤ THỂ
            await this.publishToUser(user_id, 'expense.created', expenseData);

            this.logger.log(`✅ Published expense #${expense.expense_id} to Ably`);
        } catch (error) {
            this.logger.error(`❌ Failed to publish expense: ${error.message}`);
        }
    }

    @OnEvent(EVENTS.RECURRING_EXPENSE.EXECUTED)
    async  handleRecuringExpense(recurring: RecurringTransactionResponse) {
        this.logger.debug(`📤 Publishing recurring expense.created: #${recurring.recurring_id}`);

        const {user_id, ...recurringData} = recurring;

        try {
            // Publish to channel với data cho USER CỤ THỂ
            await this.publishToUser(user_id, 'recurring.created', recurringData);

            this.logger.log(`✅ Published recurring expense #${recurring.recurring_id} to Ably`);
        } catch (error) {
            this.logger.error(`❌ Failed to publish recurring expense: ${error.message}`);
        }
    }

    /**
     * ======================
     * HELPER METHODS
     * ======================
     */

    /**
     * Publish message to specific user (alternative pattern)
     */
    async publishToUser(userId: number, eventName: string, data: any) {
        const userChannel = this.ablyClient.channels.get(`user:${userId}`);

        await userChannel.publish({
            name: eventName,
            data,
        });
    }

    /**
     * Broadcast to all users
     */
    async broadcast(eventName: string, data: any) {
        await this.expenseChannel.publish({
            name: eventName,
            data,
        });
    }
}
