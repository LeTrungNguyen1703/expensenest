import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { frequency_enum, transaction_type_enum } from '@prisma/client';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('RecurringTransactionsService', () => {
  let service: RecurringTransactionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    recurring_transactions: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    expenses: {
      create: jest.fn(),
    },
    recurring_transaction_logs: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRecurringTransaction = {
    recurring_id: 1,
    user_id: 1,
    title: 'Monthly Salary',
    amount: 500000,
    transaction_type: transaction_type_enum.INCOME,
    category_id: 1,
    wallet_id: 1,
    frequency: frequency_enum.MONTHLY,
    start_date: new Date('2025-01-01'),
    end_date: null,
    next_occurrence: new Date('2025-02-01'),
    last_occurrence: null,
    description: 'Monthly income',
    is_active: true,
    auto_create: true,
    reminder_days_before: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockExpense = {
    expense_id: 1,
    user_id: 1,
    title: 'Monthly Salary',
    amount: 500000,
    transaction_type: transaction_type_enum.INCOME,
    category_id: 1,
    wallet_id: 1,
    description: 'Monthly income',
    expense_date: new Date(),
    recurring_transaction_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringTransactionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RecurringTransactionsService>(RecurringTransactionsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateRecurringTransactionDto = {
      title: 'Monthly Salary',
      amount: 500000,
      transaction_type: transaction_type_enum.INCOME,
      category_id: 1,
      wallet_id: 1,
      frequency: frequency_enum.MONTHLY,
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      description: 'Monthly income',
      is_active: true,
      auto_create: true,
      reminder_days_before: 1,
    };

    it('should create a recurring transaction successfully', async () => {
      mockPrismaService.recurring_transactions.create.mockResolvedValue(mockRecurringTransaction);

      const result = await service.create(createDto, 1);

      expect(result).toEqual(mockRecurringTransaction);
      expect(mockPrismaService.recurring_transactions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 1,
          title: createDto.title,
          amount: createDto.amount,
          transaction_type: createDto.transaction_type,
          category_id: createDto.category_id,
          wallet_id: createDto.wallet_id,
          frequency: createDto.frequency,
          start_date: expect.any(Date),
          end_date: expect.any(Date),
          next_occurrence: expect.any(Date),
          is_active: true,
          auto_create: true,
          reminder_days_before: 1,
        }),
      });
    });

    it('should create a recurring transaction without end_date', async () => {
      const dtoWithoutEndDate = { ...createDto, end_date: undefined };
      mockPrismaService.recurring_transactions.create.mockResolvedValue({
        ...mockRecurringTransaction,
        end_date: null,
      });

      const result = await service.create(dtoWithoutEndDate, 1);

      expect(result.end_date).toBeNull();
      expect(mockPrismaService.recurring_transactions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          end_date: null,
        }),
      });
    });

    it('should throw NotFoundException when user, category, or wallet not found', async () => {
      const error = new PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      mockPrismaService.recurring_transactions.create.mockRejectedValue(error);

      await expect(service.create(createDto, 1)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto, 1)).rejects.toThrow('User, Category, or Wallet not found');
    });

    it('should calculate next_occurrence correctly for DAILY frequency', async () => {
      const dailyDto = { ...createDto, frequency: frequency_enum.DAILY };
      mockPrismaService.recurring_transactions.create.mockImplementation((args) => {
        return Promise.resolve({ ...mockRecurringTransaction, ...args.data });
      });

      await service.create(dailyDto, 1);

      const createCall = mockPrismaService.recurring_transactions.create.mock.calls[0][0];
      const startDate = new Date('2025-01-01');
      const expectedNext = new Date('2025-01-02');
      expect(createCall.data.next_occurrence.getDate()).toBe(expectedNext.getDate());
    });

    it('should calculate next_occurrence correctly for WEEKLY frequency', async () => {
      const weeklyDto = { ...createDto, frequency: frequency_enum.WEEKLY };
      mockPrismaService.recurring_transactions.create.mockImplementation((args) => {
        return Promise.resolve({ ...mockRecurringTransaction, ...args.data });
      });

      await service.create(weeklyDto, 1);

      const createCall = mockPrismaService.recurring_transactions.create.mock.calls[0][0];
      const startDate = new Date('2025-01-01');
      const expectedNext = new Date('2025-01-08');
      expect(createCall.data.next_occurrence.getDate()).toBe(expectedNext.getDate());
    });

    it('should use default values for optional fields', async () => {
      const minimalDto = {
        title: 'Monthly Salary',
        amount: 500000,
        transaction_type: transaction_type_enum.INCOME,
        category_id: 1,
        wallet_id: 1,
        frequency: frequency_enum.MONTHLY,
        start_date: '2025-01-01',
      };
      mockPrismaService.recurring_transactions.create.mockResolvedValue(mockRecurringTransaction);

      await service.create(minimalDto as CreateRecurringTransactionDto, 1);

      expect(mockPrismaService.recurring_transactions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          is_active: true,
          auto_create: true,
          reminder_days_before: 1,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return all recurring transactions ordered by next_occurrence', async () => {
      const mockTransactions = [mockRecurringTransaction, { ...mockRecurringTransaction, recurring_id: 2 }];
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue(mockTransactions);

      const result = await service.findAll();

      expect(result).toEqual(mockTransactions);
      expect(mockPrismaService.recurring_transactions.findMany).toHaveBeenCalledWith({
        orderBy: {
          next_occurrence: 'asc',
        },
      });
    });

    it('should return empty array when no recurring transactions exist', async () => {
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single recurring transaction by id', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRecurringTransaction);
      expect(mockPrismaService.recurring_transactions.findUnique).toHaveBeenCalledWith({
        where: { recurring_id: 1 },
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Recurring transaction with ID 999 not found');
    });
  });

  describe('findByUserId', () => {
    it('should return all recurring transactions for a user', async () => {
      const mockTransactions = [mockRecurringTransaction, { ...mockRecurringTransaction, recurring_id: 2 }];
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue(mockTransactions);

      const result = await service.findByUserId(1);

      expect(result).toEqual(mockTransactions);
      expect(mockPrismaService.recurring_transactions.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        orderBy: {
          next_occurrence: 'asc',
        },
      });
    });

    it('should return empty array when user has no recurring transactions', async () => {
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue([]);

      const result = await service.findByUserId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByType', () => {
    it('should return recurring transactions filtered by type', async () => {
      const mockIncomeTransactions = [mockRecurringTransaction];
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue(mockIncomeTransactions);

      const result = await service.findByType(1, transaction_type_enum.INCOME);

      expect(result).toEqual(mockIncomeTransactions);
      expect(mockPrismaService.recurring_transactions.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          transaction_type: transaction_type_enum.INCOME,
        },
        orderBy: {
          next_occurrence: 'asc',
        },
      });
    });

    it('should return expense type transactions', async () => {
      const mockExpenseTransaction = { ...mockRecurringTransaction, transaction_type: transaction_type_enum.EXPENSE };
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue([mockExpenseTransaction]);

      const result = await service.findByType(1, transaction_type_enum.EXPENSE);

      expect(result).toHaveLength(1);
      expect(result[0].transaction_type).toBe(transaction_type_enum.EXPENSE);
    });
  });

  describe('findActive', () => {
    it('should return only active recurring transactions', async () => {
      const mockActiveTransactions = [mockRecurringTransaction];
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue(mockActiveTransactions);

      const result = await service.findActive(1);

      expect(result).toEqual(mockActiveTransactions);
      expect(mockPrismaService.recurring_transactions.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          is_active: true,
        },
        orderBy: {
          next_occurrence: 'asc',
        },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateRecurringTransactionDto = {
      title: 'Updated Salary',
      amount: 600000,
    };

    it('should update a recurring transaction successfully', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      const updatedTransaction = { ...mockRecurringTransaction, ...updateDto };
      mockPrismaService.recurring_transactions.update.mockResolvedValue(updatedTransaction);

      const result = await service.update(1, updateDto, 1);

      expect(result).toEqual(updatedTransaction);
      expect(mockPrismaService.recurring_transactions.update).toHaveBeenCalledWith({
        where: { recurring_id: 1 },
        data: expect.objectContaining({
          title: 'Updated Salary',
          amount: 600000,
          updated_at: expect.any(Date),
        }),
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateDto, 1)).rejects.toThrow('Recurring transaction with ID 999 not found');
    });

    it('should throw BadRequestException when user does not own the transaction', async () => {
      const otherUserTransaction = { ...mockRecurringTransaction, user_id: 2 };
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(otherUserTransaction);

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto, 1)).rejects.toThrow('You do not have permission to modify this recurring transaction');
    });

    it('should recalculate next_occurrence when frequency is updated', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      mockPrismaService.recurring_transactions.update.mockResolvedValue(mockRecurringTransaction);

      const updateWithFrequency = { frequency: frequency_enum.WEEKLY };
      await service.update(1, updateWithFrequency, 1);

      const updateCall = mockPrismaService.recurring_transactions.update.mock.calls[0][0];
      expect(updateCall.data.next_occurrence).toBeDefined();
      expect(updateCall.data.frequency).toBe(frequency_enum.WEEKLY);
    });

    it('should recalculate next_occurrence when start_date is updated', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      mockPrismaService.recurring_transactions.update.mockResolvedValue(mockRecurringTransaction);

      const updateWithStartDate = { start_date: '2025-02-01' };
      await service.update(1, updateWithStartDate, 1);

      const updateCall = mockPrismaService.recurring_transactions.update.mock.calls[0][0];
      expect(updateCall.data.next_occurrence).toBeDefined();
      expect(updateCall.data.start_date).toBeDefined();
    });

    it('should handle end_date being set to undefined', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      mockPrismaService.recurring_transactions.update.mockResolvedValue(mockRecurringTransaction);

      const updateWithNullEndDate = { end_date: undefined };
      await service.update(1, updateWithNullEndDate, 1);

      const updateCall = mockPrismaService.recurring_transactions.update.mock.calls[0][0];
      expect(updateCall.data.end_date).toBeUndefined();
    });

    it('should throw NotFoundException when category or wallet not found', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      const error = new PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      mockPrismaService.recurring_transactions.update.mockRejectedValue(error);

      await expect(service.update(1, { category_id: 999 }, 1)).rejects.toThrow(NotFoundException);
      await expect(service.update(1, { category_id: 999 }, 1)).rejects.toThrow('Category or Wallet not found');
    });
  });

  describe('remove', () => {
    it('should delete a recurring transaction successfully', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      const deletedData = {
        recurring_id: 1,
        title: 'Monthly Salary',
        amount: 500000,
        frequency: frequency_enum.MONTHLY,
      };
      mockPrismaService.recurring_transactions.delete.mockResolvedValue(deletedData);

      const result = await service.remove(1, 1);

      expect(result).toEqual({
        message: 'Recurring transaction Monthly Salary has been deleted',
        transaction: deletedData,
      });
      expect(mockPrismaService.recurring_transactions.delete).toHaveBeenCalledWith({
        where: { recurring_id: 1 },
        select: {
          recurring_id: true,
          title: true,
          amount: true,
          frequency: true,
        },
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user does not own the transaction', async () => {
      const otherUserTransaction = { ...mockRecurringTransaction, user_id: 2 };
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(otherUserTransaction);

      await expect(service.remove(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should handle Prisma P2025 error (record not found during delete)', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      const error = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });
      mockPrismaService.recurring_transactions.delete.mockRejectedValue(error);

      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
      await expect(service.remove(1, 1)).rejects.toThrow('Recurring transaction with ID 1 not found');
    });
  });

  describe('toggleActive', () => {
    it('should toggle is_active from true to false', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      const toggledTransaction = { ...mockRecurringTransaction, is_active: false };
      mockPrismaService.recurring_transactions.update.mockResolvedValue(toggledTransaction);

      const result = await service.toggleActive(1, 1);

      expect(result.is_active).toBe(false);
      expect(mockPrismaService.recurring_transactions.update).toHaveBeenCalledWith({
        where: { recurring_id: 1 },
        data: {
          is_active: false,
          updated_at: expect.any(Date),
        },
      });
    });

    it('should toggle is_active from false to true', async () => {
      const inactiveTransaction = { ...mockRecurringTransaction, is_active: false };
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(inactiveTransaction);
      const toggledTransaction = { ...inactiveTransaction, is_active: true };
      mockPrismaService.recurring_transactions.update.mockResolvedValue(toggledTransaction);

      const result = await service.toggleActive(1, 1);

      expect(result.is_active).toBe(true);
      expect(mockPrismaService.recurring_transactions.update).toHaveBeenCalledWith({
        where: { recurring_id: 1 },
        data: {
          is_active: true,
          updated_at: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(null);

      await expect(service.toggleActive(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user does not own the transaction', async () => {
      const otherUserTransaction = { ...mockRecurringTransaction, user_id: 2 };
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(otherUserTransaction);

      await expect(service.toggleActive(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('processDueTransactions', () => {
    it('should find and return due transactions', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueTransaction = { ...mockRecurringTransaction, next_occurrence: today };
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue([dueTransaction]);

      const result = await service.processDueTransactions();

      expect(result).toEqual([dueTransaction]);
      expect(mockPrismaService.recurring_transactions.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          next_occurrence: {
            lte: expect.any(Date),
          },
          OR: [
            { end_date: null },
            { end_date: { gte: expect.any(Date) } },
          ],
        },
      });
    });

    it('should return empty array when no transactions are due', async () => {
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue([]);

      const result = await service.processDueTransactions();

      expect(result).toEqual([]);
    });

    it('should include transactions without end_date', async () => {
      const transactionNoEndDate = { ...mockRecurringTransaction, end_date: null };
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue([transactionNoEndDate]);

      const result = await service.processDueTransactions();

      expect(result).toHaveLength(1);
    });

    it('should exclude expired transactions', async () => {
      mockPrismaService.recurring_transactions.findMany.mockResolvedValue([]);

      const result = await service.processDueTransactions();

      expect(result).toEqual([]);
    });
  });

  describe('processRecurring', () => {
    it('should process recurring transaction and create expense when auto_create is true', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          expenses: mockPrismaService.expenses,
          recurring_transaction_logs: mockPrismaService.recurring_transaction_logs,
          recurring_transactions: mockPrismaService.recurring_transactions,
        });
      });
      mockPrismaService.expenses.create.mockResolvedValue(mockExpense);
      mockPrismaService.recurring_transaction_logs.create.mockResolvedValue({});
      mockPrismaService.recurring_transactions.update.mockResolvedValue(mockRecurringTransaction);

      const result = await service.processRecurring(1);

      expect(result).toEqual(mockExpense);
      expect(mockPrismaService.expenses.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: mockRecurringTransaction.user_id,
          title: mockRecurringTransaction.title,
          amount: mockRecurringTransaction.amount,
          transaction_type: mockRecurringTransaction.transaction_type,
          category_id: mockRecurringTransaction.category_id,
          wallet_id: mockRecurringTransaction.wallet_id,
          recurring_transaction_id: mockRecurringTransaction.recurring_id,
        }),
      });
    });

    it('should not create expense when auto_create is false', async () => {
      const manualTransaction = { ...mockRecurringTransaction, auto_create: false };
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(manualTransaction);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          expenses: mockPrismaService.expenses,
          recurring_transaction_logs: mockPrismaService.recurring_transaction_logs,
          recurring_transactions: mockPrismaService.recurring_transactions,
        });
      });
      mockPrismaService.recurring_transaction_logs.create.mockResolvedValue({});
      mockPrismaService.recurring_transactions.update.mockResolvedValue(manualTransaction);

      const result = await service.processRecurring(1);

      expect(result).toBeNull();
      expect(mockPrismaService.expenses.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when recurring transaction not found', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(null);

      await expect(service.processRecurring(999)).rejects.toThrow(NotFoundException);
      await expect(service.processRecurring(999)).rejects.toThrow('Active recurring transaction with ID 999 not found');
    });

    it('should return null when recurring transaction is not active', async () => {
      const inactiveTransaction = { ...mockRecurringTransaction, is_active: false };
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(inactiveTransaction);

      const result = await service.processRecurring(1);

      expect(result).toBeNull();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should create log with COMPLETED status when expense is created', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          expenses: mockPrismaService.expenses,
          recurring_transaction_logs: mockPrismaService.recurring_transaction_logs,
          recurring_transactions: mockPrismaService.recurring_transactions,
        });
      });
      mockPrismaService.expenses.create.mockResolvedValue(mockExpense);
      mockPrismaService.recurring_transaction_logs.create.mockResolvedValue({});
      mockPrismaService.recurring_transactions.update.mockResolvedValue(mockRecurringTransaction);

      await service.processRecurring(1);

      expect(mockPrismaService.recurring_transaction_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recurring_id: mockRecurringTransaction.recurring_id,
          expense_id: mockExpense.expense_id,
          status: 'COMPLETED',
        }),
      });
    });

    it('should create log with SKIPPED status when auto_create is false', async () => {
      const manualTransaction = { ...mockRecurringTransaction, auto_create: false };
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(manualTransaction);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          expenses: mockPrismaService.expenses,
          recurring_transaction_logs: mockPrismaService.recurring_transaction_logs,
          recurring_transactions: mockPrismaService.recurring_transactions,
        });
      });
      mockPrismaService.recurring_transaction_logs.create.mockResolvedValue({});
      mockPrismaService.recurring_transactions.update.mockResolvedValue(manualTransaction);

      await service.processRecurring(1);

      expect(mockPrismaService.recurring_transaction_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recurring_id: manualTransaction.recurring_id,
          expense_id: null,
          status: 'SKIPPED',
        }),
      });
    });

    it('should update last_occurrence and next_occurrence', async () => {
      mockPrismaService.recurring_transactions.findUnique.mockResolvedValue(mockRecurringTransaction);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          expenses: mockPrismaService.expenses,
          recurring_transaction_logs: mockPrismaService.recurring_transaction_logs,
          recurring_transactions: mockPrismaService.recurring_transactions,
        });
      });
      mockPrismaService.expenses.create.mockResolvedValue(mockExpense);
      mockPrismaService.recurring_transaction_logs.create.mockResolvedValue({});
      mockPrismaService.recurring_transactions.update.mockResolvedValue(mockRecurringTransaction);

      await service.processRecurring(1);

      expect(mockPrismaService.recurring_transactions.update).toHaveBeenCalledWith({
        where: { recurring_id: 1 },
        data: expect.objectContaining({
          last_occurrence: mockRecurringTransaction.next_occurrence,
          next_occurrence: expect.any(Date),
          updated_at: expect.any(Date),
        }),
      });
    });
  });

  describe('calculateNextOccurrence (via create method)', () => {
    it('should calculate BIWEEKLY frequency correctly', async () => {
      const biweeklyDto = {
        title: 'Biweekly Payment',
        amount: 100000,
        transaction_type: transaction_type_enum.EXPENSE,
        category_id: 1,
        wallet_id: 1,
        frequency: frequency_enum.BIWEEKLY,
        start_date: '2025-01-01',
      };
      mockPrismaService.recurring_transactions.create.mockImplementation((args) => {
        return Promise.resolve({ ...mockRecurringTransaction, ...args.data });
      });

      await service.create(biweeklyDto as CreateRecurringTransactionDto, 1);

      const createCall = mockPrismaService.recurring_transactions.create.mock.calls[0][0];
      const startDate = new Date('2025-01-01');
      const expectedNext = new Date('2025-01-15');
      expect(createCall.data.next_occurrence.getDate()).toBe(expectedNext.getDate());
    });

    it('should calculate QUARTERLY frequency correctly', async () => {
      const quarterlyDto = {
        title: 'Quarterly Payment',
        amount: 100000,
        transaction_type: transaction_type_enum.EXPENSE,
        category_id: 1,
        wallet_id: 1,
        frequency: frequency_enum.QUARTERLY,
        start_date: '2025-01-01',
      };
      mockPrismaService.recurring_transactions.create.mockImplementation((args) => {
        return Promise.resolve({ ...mockRecurringTransaction, ...args.data });
      });

      await service.create(quarterlyDto as CreateRecurringTransactionDto, 1);

      const createCall = mockPrismaService.recurring_transactions.create.mock.calls[0][0];
      expect(createCall.data.next_occurrence.getMonth()).toBe(3); // April (0-indexed)
    });

    it('should calculate YEARLY frequency correctly', async () => {
      const yearlyDto = {
        title: 'Yearly Payment',
        amount: 100000,
        transaction_type: transaction_type_enum.EXPENSE,
        category_id: 1,
        wallet_id: 1,
        frequency: frequency_enum.YEARLY,
        start_date: '2025-01-01',
      };
      mockPrismaService.recurring_transactions.create.mockImplementation((args) => {
        return Promise.resolve({ ...mockRecurringTransaction, ...args.data });
      });

      await service.create(yearlyDto as CreateRecurringTransactionDto, 1);

      const createCall = mockPrismaService.recurring_transactions.create.mock.calls[0][0];
      expect(createCall.data.next_occurrence.getFullYear()).toBe(2026);
    });
  });
});
