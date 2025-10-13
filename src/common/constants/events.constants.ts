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
    },
    BUDGET: {
        LIMIT_EXCEEDED: 'budget.limit.exceeded',
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
    },
    BUDGET: {
        LIMIT_EXCEEDED: 'budget:limit:exceeded',
    }
} as const

