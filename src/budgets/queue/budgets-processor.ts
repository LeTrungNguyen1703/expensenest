import {Processor, WorkerHost} from "@nestjs/bullmq";
import {Job} from "bullmq";
import {Logger} from "@nestjs/common";
import {ExpenseResponse} from "../../expenses/interfaces/expense.interface";
import {EventEmitter2} from "@nestjs/event-emitter";
import {EVENTS} from "../../common/constants/events.constants";
import {JOB_NAMES, QUEUE_NAMES} from "../../queue-constants";
import {BudgetsQueue} from "./budgets.queue";
import {BudgetsService} from "../budgets.service";
import {Budget, BudgetResponse} from "../interfaces/budget.interface";
import {ExpensesService} from "../../expenses/expenses.service";
import {PrismaService} from "../../prisma/prisma.service";


@Processor(QUEUE_NAMES.BUDGETS)
export class BudgetsProcessor extends WorkerHost {

    private logger = new Logger(BudgetsProcessor.name);

    constructor(private readonly budget: BudgetsService,
                private readonly prisma: PrismaService,
                private readonly expense: ExpensesService,
                private readonly queue: BudgetsQueue,
                private readonly emitter: EventEmitter2
    ) {

        super();
    }

    async process(job: Job, token?: string): Promise<any> {
        switch (job.name) {
            case JOB_NAMES.CHECK_BUDGET_LIMIT: {
                return this.handleBudgetsCheckLimit(job);
            }
            case JOB_NAMES.PROCESS_SINGLE_BUDGET: {
                return this.handleSingleBudget(job);
            }
        }
    }

    async handleBudgetsCheckLimit(job: Job) {
        const {expense_id} = job.data;
        this.logger.log(`Processing budget limit check, job id: ${job.id} for expense ID: ${expense_id}`);

        try {

            // Fetch the expense along with its category and active budgets
            const expense = await this.expense.findOne(expense_id);

            const budgets = await this.budget.findActiveByExpenseCategoryId(expense.category_id);

            budgets.forEach((budget) => {
                this.queue.processSingleBudget(budget, expense);
            })

        } catch (error) {
            this.logger.error(`Error processing budget limit check: ${error.message}`, error.stack);
        }
    }

    async handleSingleBudget(job: Job) {
        const budget = job.data.budgetResponse as BudgetResponse;
        const expense = job.data.expenseResponse as ExpenseResponse;

        this.logger.log(`Processing single budget, job id: ${job.id}, : ${budget.budget_id}`);

        const total = await this.prisma.expenses.aggregate({
            where: {
                category_id: budget.category_id,
                expense_date: {
                    gte: budget.start_date,
                    ...(budget.end_date ? {lte: budget.end_date} : {}), // if end_date is null, ignore this condition
                },
            },
            _sum: {amount: true},
        })

        const totalAmount = total._sum.amount ?? 0;

        if (totalAmount >= budget.amount) {
            this.emitter.emit(EVENTS.BUDGET.LIMIT_EXCEEDED, {
                budget,
                expense,
                total: totalAmount,
            });
            this.logger.log(`Budget limit exceeded for budget ID: ${budget.budget_id}`);
        }

    }
}
