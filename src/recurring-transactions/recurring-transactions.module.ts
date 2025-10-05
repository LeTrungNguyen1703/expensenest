import {Module} from '@nestjs/common';
import {RecurringTransactionsService} from './recurring-transactions.service';
import {RecurringTransactionsController} from './recurring-transactions.controller';
import {RecurringTransactionQueue} from "./queue/recurring-transaction.queue";
import {BullModule} from "@nestjs/bullmq";
import {QUEUE_NAMES} from "../../queue-constants";
import {RecurringTransactionProcessor} from "./queue/RecurringTransactionProcessor";

@Module({
    controllers: [RecurringTransactionsController],
    providers: [RecurringTransactionsService, RecurringTransactionQueue,RecurringTransactionProcessor],
    exports: [RecurringTransactionsService],
    imports: [BullModule.registerQueue({
        name: QUEUE_NAMES.RECURRING_TRANSACTIONS
    })],
})
export class RecurringTransactionsModule {
}
