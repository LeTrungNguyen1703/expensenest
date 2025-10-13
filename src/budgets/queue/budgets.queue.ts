import {Inject, Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {Queue} from "bullmq";
import {InjectQueue} from "@nestjs/bullmq";
import {JOB_NAMES, QUEUE_NAMES} from "../../queue-constants";
import {OnEvent} from "@nestjs/event-emitter";
import {EVENTS} from "../../common/constants/events.constants";
import {ExpenseResponse} from "../../expenses/interfaces/expense.interface";
import {Budget, BudgetResponse} from "../interfaces/budget.interface";


@Injectable()
export class BudgetsQueue {

    private readonly logger = new Logger(BudgetsQueue.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.BUDGETS) private readonly queue: Queue,
    ) {
    }

    @OnEvent(EVENTS.EXPENSE.CREATED)
    processBudgetCheck(expense: ExpenseResponse) {
        const {expense_id} = expense;
        this.logger.log(`Enqueuing budget check for expense ID: ${expense_id}`);
        return this.queue.add(
            JOB_NAMES.CHECK_BUDGET_LIMIT,
            {expense_id},
            {
                attempts: 3, // Retry 3 times if it fails
                backoff: {
                    type: 'exponential',
                    delay: 5000, // 5s, 10s, 20s
                },
            },
        );
    }

    processSingleBudget(budgetResponse: BudgetResponse, expenseResponse: ExpenseResponse) {
        return this.queue.add(
            JOB_NAMES.PROCESS_SINGLE_BUDGET,
            {budgetResponse, expenseResponse},
            {
                attempts: 3, // Retry 3 times if it fails
                backoff: {
                    type: 'exponential',
                    delay: 5000, // 5s, 10s, 20s
                },
            },
        );
    }
}

