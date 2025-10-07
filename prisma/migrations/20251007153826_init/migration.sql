-- CreateEnum
CREATE TYPE "frequency_enum" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "goal_status_enum" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "period_type_enum" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "transaction_type_enum" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "audit_logs" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "budget_id" SERIAL NOT NULL,
    "budget_name" VARCHAR(255) NOT NULL,
    "category_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "period_type" "period_type_enum" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN DEFAULT true,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("budget_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" SERIAL NOT NULL,
    "category_name" VARCHAR(255) NOT NULL,
    "transaction_type" "transaction_type_enum" NOT NULL,
    "description" TEXT,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "expense_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "amount" INTEGER NOT NULL,
    "transaction_type" "transaction_type_enum" NOT NULL,
    "category_id" INTEGER NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "expense_date" DATE NOT NULL,
    "description" TEXT,
    "user_id" INTEGER NOT NULL,
    "recurring_transaction_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("expense_id")
);

-- CreateTable
CREATE TABLE "invalidated_tokens" (
    "token_id" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expiry_time" TIMESTAMP(6) NOT NULL,
    "invalidated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invalidated_tokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "recurring_transaction_logs" (
    "log_id" SERIAL NOT NULL,
    "recurring_id" INTEGER NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "executed_date" DATE,
    "expense_id" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_transaction_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "recurring_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "amount" INTEGER NOT NULL,
    "transaction_type" "transaction_type_enum" NOT NULL,
    "category_id" INTEGER NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "frequency" "frequency_enum" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "next_occurrence" DATE NOT NULL,
    "last_occurrence" DATE,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "auto_create" BOOLEAN DEFAULT true,
    "reminder_days_before" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("recurring_id")
);

-- CreateTable
CREATE TABLE "savings_contributions" (
    "contribution_id" SERIAL NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "contribution_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "notes" TEXT,
    "expense_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_contributions_pkey" PRIMARY KEY ("contribution_id")
);

-- CreateTable
CREATE TABLE "savings_goals" (
    "goal_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "goal_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "target_amount" INTEGER NOT NULL,
    "current_amount" INTEGER DEFAULT 0,
    "target_date" DATE,
    "priority" INTEGER DEFAULT 0,
    "icon" VARCHAR(100),
    "color" VARCHAR(20),
    "wallet_id" INTEGER,
    "status" "goal_status_enum" DEFAULT 'ACTIVE',
    "is_recurring" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("goal_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "wallet_id" SERIAL NOT NULL,
    "wallet_name" VARCHAR(255) NOT NULL,
    "balance" INTEGER DEFAULT 0,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateIndex
CREATE INDEX "idx_audit_logs_created" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_budgets_active" ON "budgets"("is_active");

-- CreateIndex
CREATE INDEX "idx_budgets_category" ON "budgets"("category_id");

-- CreateIndex
CREATE INDEX "idx_budgets_user" ON "budgets"("user_id");

-- CreateIndex
CREATE INDEX "idx_categories_type" ON "categories"("transaction_type");

-- CreateIndex
CREATE INDEX "idx_categories_user" ON "categories"("user_id");

-- CreateIndex
CREATE INDEX "idx_expenses_category" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX "idx_expenses_date" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "idx_expenses_recurring" ON "expenses"("recurring_transaction_id");

-- CreateIndex
CREATE INDEX "idx_expenses_type" ON "expenses"("transaction_type");

-- CreateIndex
CREATE INDEX "idx_expenses_user" ON "expenses"("user_id");

-- CreateIndex
CREATE INDEX "idx_expenses_wallet" ON "expenses"("wallet_id");

-- CreateIndex
CREATE INDEX "idx_invalidated_tokens_expiry" ON "invalidated_tokens"("expiry_time");

-- CreateIndex
CREATE INDEX "idx_recurring_logs_recurring" ON "recurring_transaction_logs"("recurring_id");

-- CreateIndex
CREATE INDEX "idx_recurring_logs_scheduled" ON "recurring_transaction_logs"("scheduled_date");

-- CreateIndex
CREATE INDEX "idx_recurring_logs_status" ON "recurring_transaction_logs"("status");

-- CreateIndex
CREATE INDEX "idx_recurring_active" ON "recurring_transactions"("is_active");

-- CreateIndex
CREATE INDEX "idx_recurring_category" ON "recurring_transactions"("category_id");

-- CreateIndex
CREATE INDEX "idx_recurring_next_occurrence" ON "recurring_transactions"("next_occurrence");

-- CreateIndex
CREATE INDEX "idx_recurring_user" ON "recurring_transactions"("user_id");

-- CreateIndex
CREATE INDEX "idx_savings_contributions_date" ON "savings_contributions"("contribution_date");

-- CreateIndex
CREATE INDEX "idx_savings_contributions_goal" ON "savings_contributions"("goal_id");

-- CreateIndex
CREATE INDEX "idx_savings_contributions_user" ON "savings_contributions"("user_id");

-- CreateIndex
CREATE INDEX "idx_savings_goals_status" ON "savings_goals"("status");

-- CreateIndex
CREATE INDEX "idx_savings_goals_target_date" ON "savings_goals"("target_date");

-- CreateIndex
CREATE INDEX "idx_savings_goals_user" ON "savings_goals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_wallets_user" ON "wallets"("user_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("wallet_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "fk_expenses_recurring" FOREIGN KEY ("recurring_transaction_id") REFERENCES "recurring_transactions"("recurring_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invalidated_tokens" ADD CONSTRAINT "invalidated_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_transaction_logs" ADD CONSTRAINT "recurring_transaction_logs_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("expense_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_transaction_logs" ADD CONSTRAINT "recurring_transaction_logs_recurring_id_fkey" FOREIGN KEY ("recurring_id") REFERENCES "recurring_transactions"("recurring_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("wallet_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("expense_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "savings_goals"("goal_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_contributions" ADD CONSTRAINT "savings_contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("wallet_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
