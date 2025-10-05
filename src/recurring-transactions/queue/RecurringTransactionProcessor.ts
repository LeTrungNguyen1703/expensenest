import {Processor, WorkerHost} from "@nestjs/bullmq";
import {QUEUE_NAMES, JOB_NAMES} from "../../../queue-constants";
import {Job} from "bullmq";
import {Logger} from "@nestjs/common";
import {RecurringTransactionsService} from "../recurring-transactions.service";
import {ExpenseResponse} from "../../expenses/interfaces/expense.interface";


@Processor(QUEUE_NAMES.RECURRING_TRANSACTIONS)
export class RecurringTransactionProcessor extends WorkerHost {

    private logger = new Logger(RecurringTransactionProcessor.name);

    constructor(private readonly recurringTransactionService: RecurringTransactionsService) {
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
            case JOB_NAMES.NOTIFICATION_RECURRING_AFTER_CREATE_EXPENSE: {
                return this.handleNotificationAfterCreateExpense(job);
            }
        }
    }

    async handleDailyCheck(job: Job) {
        this.logger.log(`Processing daily check for due recurring transactions, job id: ${job.id}`);

        try {
            const processedCount = await this.recurringTransactionService.processDueTransactions();
            this.logger.log(`Processed ${processedCount} due recurring transactions.`);

            //TODO: add notification to users about processed transactions
            return {
                success: true,
                processedCount: processedCount,
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
            await this.recurringTransactionService.processRecurring(recurringId);

            //TODO: add notification to user about processed transaction
            this.logger.log(`Successfully processed recurring transaction with id: ${recurringId}`);
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

    async handleNotificationAfterCreateExpense(job: Job<{ expense: ExpenseResponse }>) {
        //TODO: implement notification logic
        this.logger.log(`Handling notifications after creating expense, job id: ${job.id}`);
        const {expense} = job.data;
    }
}
