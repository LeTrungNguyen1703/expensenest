export const QUEUE_NAMES = {
    RECURRING_TRANSACTIONS: 'recurring-transactions',
} as const;

export const JOB_NAMES = {
    CHECK_DUE_RECURRING_TRANSACTIONS: 'check-due-recurring-transactions',
    PROCESS_SINGLE_RECURRING: 'process-single-recurring',
    NOTIFICATION_RECURRING_AFTER_CREATE_EXPENSE: 'notification-recurring-after-create-expense',
} as const;