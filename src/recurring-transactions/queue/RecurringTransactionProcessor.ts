import {Processor, WorkerHost} from "@nestjs/bullmq";
import {QUEUE_NAMES, JOB_NAMES} from "../../../queue-constants";
import {Job} from "bullmq";
import {Logger} from "@nestjs/common";
import {RecurringTransactionsService} from "../recurring-transactions.service";
import {ExpenseResponse} from "../../expenses/interfaces/expense.interface";
import {RecurringTransactionQueue} from "./recurring-transaction.queue";
import {EventEmitter2} from "@nestjs/event-emitter";
import {EVENTS} from "../../common/constants/events.constants";


@Processor(QUEUE_NAMES.RECURRING_TRANSACTIONS)
export class RecurringTransactionProcessor extends WorkerHost {

    private logger = new Logger(RecurringTransactionProcessor.name);

    constructor(private readonly recurringTransactionService: RecurringTransactionsService,
                private readonly queue: RecurringTransactionQueue,
                private readonly emitter: EventEmitter2
    ) {

        super();
    }

    async process(job: Job, token?: string): Promise<any> {
        switch (job.name) {
            case JOB_NAMES.CHECK_DUE_RECURRING_TRANSACTIONS: {
                return this.handleDailyCheck(job);
            }
            case JOB_NAMES.PROCESS_SINGLE_RECURRING: {
                return this.handleSingleRecurring(job);
            }
        }
    }

    async handleDailyCheck(job: Job) {
        this.logger.log(`Processing daily check for due recurring transactions, job id: ${job.id}`);

        try {
            const dueTransactions = await this.recurringTransactionService.processDueTransactions();
            this.logger.log(`Processed ${dueTransactions} due recurring transactions.`);

            for (const transaction of dueTransactions) {
                await this.queue.processRecurringTransaction(transaction.recurring_id)
                this.emitter.emit(EVENTS.RECURRING_EXPENSE.EXECUTED, transaction)
            }


            return {
                success: true,
                dueTransaction: dueTransactions,
                processedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`Failed to process daily check for due recurring transactions, job id: ${job.id} - Error: ${error.message}`);
            throw error;
        }
    }

    async handleSingleRecurring(job: Job<{ recurringId: number }>) {
        this.logger.log(`Processing single recurring transaction, job id: ${job.id}, recurringId: ${job.data.recurringId}`);
        const {recurringId} = job.data;

        try {
            const expense = await this.recurringTransactionService.processRecurring(recurringId);

            this.logger.log(`Successfully processed recurring transaction with id: ${recurringId}`);
            this.emitter.emit(EVENTS.EXPENSE.CREATED, expense)

            return {
                success: true,
                recurringId: recurringId,
                processedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`Failed to process recurring transaction with id: ${recurringId} - Error: ${error.message}`);
            throw error;
        }

    }

}
