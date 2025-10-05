import {Inject, Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {JOB_NAMES, QUEUE_NAMES} from "../../../queue-constants";
import {Queue} from "bullmq";
import {InjectQueue} from "@nestjs/bullmq";


@Injectable()
export class RecurringTransactionQueue implements OnModuleInit {

    private logger = new Logger(RecurringTransactionQueue.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.RECURRING_TRANSACTIONS) private readonly queue: Queue,
    ) {
    }

    async onModuleInit() {
        await this.setUpDailyScheduler();
    }

    private async setUpDailyScheduler() {
        const repeatableJobs = await this.queue.getJobSchedulers();
        for (const job of repeatableJobs) {
            await this.queue.removeJobScheduler(job.key);
        }

        // Tạo job chạy hàng ngày lúc 00:01
        await this.queue.add(
            JOB_NAMES.CHECK_DUE_RECURRING_TRANSACTIONS,
            {},
            {
                repeat: {
                    pattern: '57 0 * * *', // Cron: 00:57 mỗi ngày
                },
                jobId: 'daily-recurring-check',
            },
        );
        this.logger.log(`Daily scheduler for recurring transactions set up at 00:01 each day.`);
    }

    // Thêm job xử lý một recurring transaction cụ thể
    async processRecurringTransaction(recurringId: number) {
        await this.queue.add(
            JOB_NAMES.PROCESS_SINGLE_RECURRING,
            {recurringId},
            {
                attempts: 3, // Retry 3 lần nếu fail
                backoff: {
                    type: 'exponential',
                    delay: 5000, // 5s, 10s, 20s
                },
            },
        );
    }

    async processNotificationRecurringAfterCreateExpense() {
        await this.queue.add(
            JOB_NAMES.NOTIFICATION_RECURRING_AFTER_CREATE_EXPENSE,
            {},
            {
                attempts: 3, // Retry 3 lần nếu fail
                backoff: {
                    type: 'exponential',
                    delay: 5000, // 5s, 10s, 20s
                },
            },
        );
    }
}

