export const EVENTS = {
    EXPENSE: {
        CREATED: 'expense.created',
        UPDATED: 'expense.updated',
        DELETED: 'expense.deleted',
    },
    RECURRING_EXPENSE: {
        EXECUTED: 'recurring.expense.executed',
    },
    SAVINGS_GOAL: {
        COMPLETE: 'recurring.expense.complete',
    }
} as const;

export const SOCKET_EVENTS = {
    EXPENSE: {
        CREATED: 'expense:created',
        UPDATED: 'expense:updated',
        DELETED: 'expense:deleted',
    },
    RECURRING_EXPENSE: {
        EXECUTED: 'recurring:expense:executed',
    },
    SAVINGS_GOAL: {
        COMPLETE: 'savings:goal:complete',
    }
}as const

