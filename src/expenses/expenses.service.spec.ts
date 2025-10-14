import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { transaction_type_enum } from '@prisma/client';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { EVENTS } from '../common/constants/events.constants';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    expenses: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockExpense = {
    expense_id: 1,
    user_id: 1,
    title: 'Grocery Shopping',
    amount: 50000,
    transaction_type: transaction_type_enum.EXPENSE,
    category_id: 1,
    wallet_id: 1,
    expense_date: new Date('2025-01-15'),
    description: 'Weekly groceries',
    recurring_transaction_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateExpenseDto = {
      title: 'Grocery Shopping',
      amount: 50000,
      transaction_type: transaction_type_enum.EXPENSE,
      category_id: 1,
      wallet_id: 1,
      expense_date: '2025-01-15',
      description: 'Weekly groceries',
    };

    it('should create an expense successfully', async () => {
      mockPrismaService.expenses.create.mockResolvedValue(mockExpense);

      const result = await service.create(createDto, 1);

      expect(result).toEqual(mockExpense);
      expect(mockPrismaService.expenses.create).toHaveBeenCalledWith({
        data: {
          user_id: 1,
          title: createDto.title,
          amount: createDto.amount,
          transaction_type: createDto.transaction_type,
          category_id: createDto.category_id,
          wallet_id: createDto.wallet_id,
          expense_date: expect.any(Date),
          description: createDto.description,
        },
      });
    });

    it('should emit expense.created event after creation', async () => {
      mockPrismaService.expenses.create.mockResolvedValue(mockExpense);

      await service.create(createDto, 1);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EVENTS.EXPENSE.CREATED, mockExpense);
    });

    it('should create expense without optional fields', async () => {
      const minimalDto: CreateExpenseDto = {
        title: 'Quick Expense',
        amount: 10000,
        transaction_type: transaction_type_enum.EXPENSE,
        category_id: 1,
        wallet_id: 1,
        expense_date: '2025-01-15',
      };
      const minimalExpense = { ...mockExpense, description: null };
      mockPrismaService.expenses.create.mockResolvedValue(minimalExpense);

      const result = await service.create(minimalDto, 1);

      expect(result).toEqual(minimalExpense);
    });

    it('should create expense with recurring_transaction_id', async () => {
      const recurringDto: CreateExpenseDto = {
        ...createDto,
        recurring_transaction_id: 5,
      };
      const recurringExpense = { ...mockExpense, recurring_transaction_id: 5 };
      mockPrismaService.expenses.create.mockResolvedValue(recurringExpense);

      const result = await service.create(recurringDto, 1);

      expect(result.recurring_transaction_id).toBe(5);
    });

    it('should throw NotFoundException when category, wallet, or recurring transaction not found', async () => {
      const error = new PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      mockPrismaService.expenses.create.mockRejectedValue(error);

      await expect(service.create(createDto, 1)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto, 1)).rejects.toThrow(
        'Category, Wallet, or Recurring Transaction not found',
      );
    });

    it('should handle expense_date conversion correctly', async () => {
      mockPrismaService.expenses.create.mockImplementation((args) => {
        expect(args.data.expense_date).toBeInstanceOf(Date);
        return Promise.resolve(mockExpense);
      });

      await service.create(createDto, 1);

      expect(mockPrismaService.expenses.create).toHaveBeenCalled();
    });

    it('should create income transaction', async () => {
      const incomeDto: CreateExpenseDto = {
        ...createDto,
        transaction_type: transaction_type_enum.INCOME,
        title: 'Salary',
      };
      const incomeExpense = { ...mockExpense, transaction_type: transaction_type_enum.INCOME };
      mockPrismaService.expenses.create.mockResolvedValue(incomeExpense);

      const result = await service.create(incomeDto, 1);

      expect(result.transaction_type).toBe(transaction_type_enum.INCOME);
    });
  });

  describe('findAll', () => {
    it('should return all expenses ordered by date descending', async () => {
      const mockExpenses = [
        mockExpense,
        { ...mockExpense, expense_id: 2, expense_date: new Date('2025-01-14') },
      ];
      mockPrismaService.expenses.findMany.mockResolvedValue(mockExpenses);

      const result = await service.findAll();

      expect(result).toEqual(mockExpenses);
      expect(mockPrismaService.expenses.findMany).toHaveBeenCalledWith({
        orderBy: {
          expense_date: 'desc',
        },
      });
    });

    it('should return empty array when no expenses exist', async () => {
      mockPrismaService.expenses.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single expense by id', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(mockExpense);

      const result = await service.findOne(1);

      expect(result).toEqual(mockExpense);
      expect(mockPrismaService.expenses.findUnique).toHaveBeenCalledWith({
        where: { expense_id: 1 },
      });
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Expense with ID 999 not found');
    });
  });

  describe('findByUserId', () => {
    it('should return all expenses for a user', async () => {
      const mockExpenses = [mockExpense, { ...mockExpense, expense_id: 2 }];
      mockPrismaService.expenses.findMany.mockResolvedValue(mockExpenses);

      const result = await service.findByUserId(1);

      expect(result).toEqual(mockExpenses);
      expect(mockPrismaService.expenses.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        orderBy: {
          expense_date: 'desc',
        },
      });
    });

    it('should return empty array when user has no expenses', async () => {
      mockPrismaService.expenses.findMany.mockResolvedValue([]);

      const result = await service.findByUserId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByType', () => {
    it('should return expenses filtered by EXPENSE type', async () => {
      const mockExpensesList = [mockExpense];
      mockPrismaService.expenses.findMany.mockResolvedValue(mockExpensesList);

      const result = await service.findByType(1, transaction_type_enum.EXPENSE);

      expect(result).toEqual(mockExpensesList);
      expect(mockPrismaService.expenses.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          transaction_type: transaction_type_enum.EXPENSE,
        },
        orderBy: {
          expense_date: 'desc',
        },
      });
    });

    it('should return income transactions', async () => {
      const mockIncome = { ...mockExpense, transaction_type: transaction_type_enum.INCOME };
      mockPrismaService.expenses.findMany.mockResolvedValue([mockIncome]);

      const result = await service.findByType(1, transaction_type_enum.INCOME);

      expect(result).toHaveLength(1);
      expect(result[0].transaction_type).toBe(transaction_type_enum.INCOME);
    });

    it('should return empty array when no transactions of specified type exist', async () => {
      mockPrismaService.expenses.findMany.mockResolvedValue([]);

      const result = await service.findByType(1, transaction_type_enum.INCOME);

      expect(result).toEqual([]);
    });
  });

  describe('findByCategory', () => {
    it('should return expenses filtered by category', async () => {
      const mockExpenses = [mockExpense];
      mockPrismaService.expenses.findMany.mockResolvedValue(mockExpenses);

      const result = await service.findByCategory(1, 1);

      expect(result).toEqual(mockExpenses);
      expect(mockPrismaService.expenses.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          category_id: 1,
        },
        orderBy: {
          expense_date: 'desc',
        },
      });
    });

    it('should return empty array when no expenses in category', async () => {
      mockPrismaService.expenses.findMany.mockResolvedValue([]);

      const result = await service.findByCategory(1, 999);

      expect(result).toEqual([]);
    });
  });

  describe('findByWallet', () => {
    it('should return expenses filtered by wallet', async () => {
      const mockExpenses = [mockExpense];
      mockPrismaService.expenses.findMany.mockResolvedValue(mockExpenses);

      const result = await service.findByWallet(1, 1);

      expect(result).toEqual(mockExpenses);
      expect(mockPrismaService.expenses.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          wallet_id: 1,
        },
        orderBy: {
          expense_date: 'desc',
        },
      });
    });

    it('should return empty array when no expenses in wallet', async () => {
      mockPrismaService.expenses.findMany.mockResolvedValue([]);

      const result = await service.findByWallet(1, 999);

      expect(result).toEqual([]);
    });
  });

  describe('findByDateRange', () => {
    it('should return expenses within date range', async () => {
      const mockExpenses = [mockExpense];
      mockPrismaService.expenses.findMany.mockResolvedValue(mockExpenses);

      const result = await service.findByDateRange(1, '2025-01-01', '2025-01-31');

      expect(result).toEqual(mockExpenses);
      expect(mockPrismaService.expenses.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          expense_date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        orderBy: {
          expense_date: 'desc',
        },
      });
    });

    it('should handle date conversion correctly', async () => {
      mockPrismaService.expenses.findMany.mockImplementation((args) => {
        expect(args.where.expense_date.gte).toBeInstanceOf(Date);
        expect(args.where.expense_date.lte).toBeInstanceOf(Date);
        return Promise.resolve([mockExpense]);
      });

      await service.findByDateRange(1, '2025-01-01', '2025-01-31');

      expect(mockPrismaService.expenses.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no expenses in date range', async () => {
      mockPrismaService.expenses.findMany.mockResolvedValue([]);

      const result = await service.findByDateRange(1, '2025-12-01', '2025-12-31');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updateDto: UpdateExpenseDto = {
      title: 'Updated Grocery',
      amount: 60000,
    };

    it('should update an expense successfully', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(mockExpense);
      const updatedExpense = { ...mockExpense, ...updateDto };
      mockPrismaService.expenses.update.mockResolvedValue(updatedExpense);

      const result = await service.update(1, updateDto, 1);

      expect(result).toEqual(updatedExpense);
      expect(mockPrismaService.expenses.update).toHaveBeenCalledWith({
        where: { expense_id: 1 },
        data: expect.objectContaining({
          title: 'Updated Grocery',
          amount: 60000,
          updated_at: expect.any(Date),
        }),
      });
    });

    it('should emit expense.updated event after update', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(mockExpense);
      const updatedExpense = { ...mockExpense, ...updateDto };
      mockPrismaService.expenses.update.mockResolvedValue(updatedExpense);

      await service.update(1, updateDto, 1);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EVENTS.EXPENSE.UPDATED, updatedExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateDto, 1)).rejects.toThrow('Expense with ID 999 not found');
    });

    it('should throw BadRequestException when user does not own the expense', async () => {
      const otherUserExpense = { ...mockExpense, user_id: 2 };
      mockPrismaService.expenses.findUnique.mockResolvedValue(otherUserExpense);

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        'You do not have permission to update this expense',
      );
    });

    it('should update expense_date when provided', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(mockExpense);
      mockPrismaService.expenses.update.mockResolvedValue(mockExpense);

      const updateWithDate = { expense_date: '2025-02-01' };
      await service.update(1, updateWithDate, 1);

      const updateCall = mockPrismaService.expenses.update.mock.calls[0][0];
      expect(updateCall.data.expense_date).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when category or wallet not found', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(mockExpense);
      const error = new PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });
      mockPrismaService.expenses.update.mockRejectedValue(error);

      await expect(service.update(1, { category_id: 999 }, 1)).rejects.toThrow(NotFoundException);
      await expect(service.update(1, { category_id: 999 }, 1)).rejects.toThrow(
        'Category, Wallet, or Recurring Transaction not found',
      );
    });

    it('should update only provided fields', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(mockExpense);
      mockPrismaService.expenses.update.mockResolvedValue(mockExpense);

      const partialUpdate = { title: 'New Title' };
      await service.update(1, partialUpdate, 1);

      const updateCall = mockPrismaService.expenses.update.mock.calls[0][0];
      expect(updateCall.data.title).toBe('New Title');
      expect(updateCall.data.amount).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should delete an expense successfully', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(mockExpense);
      const deletedData = {
        expense_id: 1,
        title: 'Grocery Shopping',
        amount: 50000,
        expense_date: new Date('2025-01-15'),
      };
      mockPrismaService.expenses.delete.mockResolvedValue(deletedData);

      const result = await service.remove(1, 1);

      expect(result).toEqual({
        message: 'Expense Grocery Shopping has been deleted',
        expense: deletedData,
      });
      expect(mockPrismaService.expenses.delete).toHaveBeenCalledWith({
        where: { expense_id: 1 },
        select: {
          expense_id: true,
          title: true,
          amount: true,
          expense_date: true,
        },
      });
    });

    it('should emit expense.deleted event before deletion', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(mockExpense);
      mockPrismaService.expenses.delete.mockResolvedValue({
        expense_id: 1,
        title: 'Grocery Shopping',
        amount: 50000,
        expense_date: new Date('2025-01-15'),
      });

      await service.remove(1, 1);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(EVENTS.EXPENSE.DELETED, mockExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999, 1)).rejects.toThrow('Expense with ID 999 not found');
    });

    it('should throw BadRequestException when user does not own the expense', async () => {
      const otherUserExpense = { ...mockExpense, user_id: 2 };
      mockPrismaService.expenses.findUnique.mockResolvedValue(otherUserExpense);

      await expect(service.remove(1, 1)).rejects.toThrow(BadRequestException);
      await expect(service.remove(1, 1)).rejects.toThrow(
        'You do not have permission to delete this expense',
      );
    });

    it('should handle Prisma P2025 error (record not found during delete)', async () => {
      mockPrismaService.expenses.findUnique.mockResolvedValue(mockExpense);
      const error = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });
      mockPrismaService.expenses.delete.mockRejectedValue(error);

      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
      await expect(service.remove(1, 1)).rejects.toThrow('Expense with ID 1 not found');
    });
  });

  describe('getTotalByType', () => {
    it('should return total for expense type without date range', async () => {
      mockPrismaService.expenses.aggregate.mockResolvedValue({
        _sum: {
          amount: 150000,
        },
      });

      const result = await service.getTotalByType(1, transaction_type_enum.EXPENSE);

      expect(result).toEqual({ total: 150000 });
      expect(mockPrismaService.expenses.aggregate).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          transaction_type: transaction_type_enum.EXPENSE,
        },
        _sum: {
          amount: true,
        },
      });
    });

    it('should return total for income type', async () => {
      mockPrismaService.expenses.aggregate.mockResolvedValue({
        _sum: {
          amount: 500000,
        },
      });

      const result = await service.getTotalByType(1, transaction_type_enum.INCOME);

      expect(result).toEqual({ total: 500000 });
    });

    it('should return total with date range', async () => {
      mockPrismaService.expenses.aggregate.mockResolvedValue({
        _sum: {
          amount: 75000,
        },
      });

      const result = await service.getTotalByType(
        1,
        transaction_type_enum.EXPENSE,
        '2025-01-01',
        '2025-01-31',
      );

      expect(result).toEqual({ total: 75000 });
      expect(mockPrismaService.expenses.aggregate).toHaveBeenCalledWith({
        where: {
          user_id: 1,
          transaction_type: transaction_type_enum.EXPENSE,
          expense_date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        _sum: {
          amount: true,
        },
      });
    });

    it('should return 0 when no transactions found', async () => {
      mockPrismaService.expenses.aggregate.mockResolvedValue({
        _sum: {
          amount: null,
        },
      });

      const result = await service.getTotalByType(1, transaction_type_enum.EXPENSE);

      expect(result).toEqual({ total: 0 });
    });

    it('should handle date conversion in aggregate query', async () => {
      mockPrismaService.expenses.aggregate.mockImplementation((args) => {
        if (args.where.expense_date) {
          expect(args.where.expense_date.gte).toBeInstanceOf(Date);
          expect(args.where.expense_date.lte).toBeInstanceOf(Date);
        }
        return Promise.resolve({
          _sum: {
            amount: 100000,
          },
        });
      });

      await service.getTotalByType(1, transaction_type_enum.EXPENSE, '2025-01-01', '2025-01-31');

      expect(mockPrismaService.expenses.aggregate).toHaveBeenCalled();
    });
  });
});
