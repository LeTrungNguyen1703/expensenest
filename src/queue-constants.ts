export const QUEUE_NAMES = {
    RECURRING_TRANSACTIONS: 'recurring-transactions',
    BUDGETS: 'budgets',
} as const;

export const JOB_NAMES = {
    //------------------- Recurring Transactions Jobs ------------------
    CHECK_DUE_RECURRING_TRANSACTIONS: 'check-due-recurring-transactions',
    PROCESS_SINGLE_RECURRING: 'process-single-recurring',
    NOTIFICATION_RECURRING_AFTER_CREATE_EXPENSE: 'notification-recurring-after-create-expense',
    //------------------- Budget Jobs ------------------
    CHECK_BUDGET_LIMIT: 'check-budget-limit',
    PROCESS_SINGLE_BUDGET: 'process-single-budget',
} as const;