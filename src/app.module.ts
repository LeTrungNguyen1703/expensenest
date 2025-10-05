import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {jwtConstants} from "./auth/constants";
import {ConfigModule} from "@nestjs/config";
import {CacheModule} from "@nestjs/cache-manager";
import {CacheableMemory, Keyv} from "cacheable";
import KeyvRedis from "@keyv/redis";
import {BullModule} from "@nestjs/bullmq";
import {UserModule} from './user/user.module';
import {PrismaModule} from "./prisma/prisma.module";
import {AuthModule} from "./auth/auth.module";
import { BudgetsModule } from './budgets/budgets.module';
import { CategoriesModule } from './categories/categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { RecurringTransactionsModule } from './recurring-transactions/recurring-transactions.module';
import { SavingsContributionsModule } from './savings-contributions/savings-contributions.module';
import { RecurringTransactionLogsModule } from './recurring_transaction_logs/recurring_transaction_logs.module';
import { InvalidatedTokensModule } from './invalidated-tokens/invalidated-tokens.module';
import { SavingsGoalsModule } from './savings-goals/savings-goals.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
    imports: [ConfigModule.forRoot({
        isGlobal: true,
        cache: true,
        load: [jwtConstants],
    }),
        CacheModule.registerAsync({
            isGlobal: true,
            useFactory: async () => {
                return {
                    stores: [
                        new Keyv({
                            store: new CacheableMemory({ttl: 60000, lruSize: 5000}),
                        }),
                        new KeyvRedis('redis://localhost:6379'),
                    ],
                };
            },
        }),
        BullModule.forRoot({
            connection: {
                host: 'localhost',
                port: 6379,
            },
        }),
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
        WalletsModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}
