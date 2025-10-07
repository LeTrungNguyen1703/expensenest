import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {jwtConstants} from "./auth/constants";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {CacheModule} from "@nestjs/cache-manager";
import {CacheableMemory, Keyv} from "cacheable";
import KeyvRedis from "@keyv/redis";
import {BullModule} from "@nestjs/bullmq";
import {UserModule} from './user/user.module';
import {PrismaModule} from "./prisma/prisma.module";
import {AuthModule} from "./auth/auth.module";
import {BudgetsModule} from './budgets/budgets.module';
import {CategoriesModule} from './categories/categories.module';
import {ExpensesModule} from './expenses/expenses.module';
import {RecurringTransactionsModule} from './recurring-transactions/recurring-transactions.module';
import {SavingsContributionsModule} from './savings-contributions/savings-contributions.module';
import {RecurringTransactionLogsModule} from './recurring_transaction_logs/recurring_transaction_logs.module';
import {InvalidatedTokensModule} from './invalidated-tokens/invalidated-tokens.module';
import {SavingsGoalsModule} from './savings-goals/savings-goals.module';
import {WalletsModule} from './wallets/wallets.module';
import {BullBoardModule} from "@bull-board/nestjs";
import {ExpressAdapter} from "@bull-board/express";
import {BullMQAdapter} from "@bull-board/api/bullMQAdapter";
import {AdminModule} from './admin/admin.module';
import {ExpenseGatewayModule} from './expense-gateway/expense-gateway.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AblyModule } from './ably/ably.module';
import {QUEUE_NAMES} from "./queue-constants";
@Module({
    imports: [ConfigModule.forRoot({
        isGlobal: true,
        cache: true,
        load: [jwtConstants],
    }),
        CacheModule.registerAsync({
            isGlobal: true,
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                // Use a single full REDIS_URL for cache (required)
                const redisUrl = config.get<string | undefined>('REDIS_URL');
                if (!redisUrl) {
                    throw new Error('REDIS_URL is required in environment for cache configuration');
                }

                return {
                    stores: [
                        new Keyv({
                            store: new CacheableMemory({ttl: 60000, lruSize: 5000}),
                        }),
                        new KeyvRedis(redisUrl),
                    ],
                };
            },
        }),
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => {
                const redisUrl = config.get<string | undefined>('REDIS_URL');
                if (!redisUrl) {
                    throw new Error('REDIS_URL is required in environment for BullMQ configuration');
                }
                return { connection: { url: redisUrl } };
            },
        }),
        BullModule.registerQueue({
            name: QUEUE_NAMES.RECURRING_TRANSACTIONS
        }),
        // Config Bull Board
        BullBoardModule.forRoot({
            route: '/admin/queues',
            adapter: ExpressAdapter, // hoặc FastifyAdapter nếu dùng Fastify
        }),

        // Đăng ký queues vào Bull Board
        BullBoardModule.forFeature({
            name: QUEUE_NAMES.RECURRING_TRANSACTIONS,
            adapter: BullMQAdapter, // ⚠️ Quan trọng: dùng BullMQAdapter
        }),
        EventEmitterModule.forRoot({
            wildcard: true,           // nên bật để dễ nhóm event theo namespace: "user.*"
            delimiter: '.',           // giữ mặc định
            newListener: false,        // tắt, không cần nếu không debug
            removeListener: false,     // tắt, hiếm khi cần
            maxListeners: 20,          // tăng nhẹ giới hạn an toàn
            verboseMemoryLeak: true,   // nên bật trong môi trường dev để dễ phát hiện rò rỉ
            ignoreErrors: false,
        })
        ,
        UserModule,
        PrismaModule,
        AuthModule,
        BudgetsModule,
        CategoriesModule,
        ExpensesModule,
        RecurringTransactionsModule,
        SavingsContributionsModule,
        RecurringTransactionLogsModule,
        InvalidatedTokensModule,
        SavingsGoalsModule,
        WalletsModule,
        AdminModule,
        ExpenseGatewayModule,
        AblyModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}
