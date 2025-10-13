import {Module} from '@nestjs/common';
import {BudgetsService} from './budgets.service';
import {BudgetsController} from './budgets.controller';
import {BullModule} from "@nestjs/bullmq";
import {QUEUE_NAMES} from "../queue-constants";
import {BudgetsQueue} from "./queue/budgets.queue";
import {BudgetsProcessor} from "./queue/budgets-processor";
import {ExpensesModule} from "../expenses/expenses.module";

@Module({
    controllers: [BudgetsController],
    providers: [BudgetsService, BudgetsQueue, BudgetsProcessor],
    exports: [BudgetsService],
    imports: [BullModule.registerQueue({
        name: QUEUE_NAMES.BUDGETS
    }),ExpensesModule
    ]
})
export class BudgetsModule {
}
