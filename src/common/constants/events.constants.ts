export const EVENTS = {
    EXPENSE: {
        CREATED: 'expense.created',
        UPDATED: 'expense.updated',
        DELETED: 'expense.deleted',
    },
    RECURRING_EXPENSE: {
        EXECUTED: 'recurring.expense.executed',
    }
} as const;

export const SOCKET_EVENTS = {
    EXPENSE: {
        CREATED: 'expense_created',
        UPDATED: 'expense_updated',
        DELETED: 'expense_deleted',
    },
    RECURRING_EXPENSE: {
        EXECUTED: 'recurring_expense_executed',
    }
}as const

