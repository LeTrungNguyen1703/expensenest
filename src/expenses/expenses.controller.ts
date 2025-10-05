import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpCode, HttpStatus, Request, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExpenseResponse } from './interfaces/expense.interface';
import { transaction_type_enum } from '@prisma/client';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'Expense successfully created', type: ExpenseResponse })
  @ApiResponse({ status: 404, description: 'Category, Wallet, or Recurring Transaction not found' })
  @ApiBody({ type: CreateExpenseDto, description: 'Expense creation data' })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createExpenseDto: CreateExpenseDto, @Request() req): Promise<ExpenseResponse> {
    return this.expensesService.create(createExpenseDto, req.user.userId);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all expenses' })
  @ApiResponse({ status: 200, description: 'Returns all expenses', type: [ExpenseResponse] })
  async findAll(): Promise<ExpenseResponse[]> {
    return this.expensesService.findAll();
  }

  @Get('my-expenses')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all expenses for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns user expenses', type: [ExpenseResponse] })
  async findByUserId(@Request() req): Promise<ExpenseResponse[]> {
    return this.expensesService.findByUserId(req.user.userId);
  }

  @Get('type/:type')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get expenses by transaction type for the authenticated user' })
  @ApiParam({ name: 'type', description: 'Transaction type', enum: ['INCOME', 'EXPENSE'] })
  @ApiResponse({ status: 200, description: 'Returns expenses of the specified type', type: [ExpenseResponse] })
  async findByType(@Param('type') type: transaction_type_enum, @Request() req): Promise<ExpenseResponse[]> {
    return this.expensesService.findByType(req.user.userId, type);
  }

  @Get('category/:categoryId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get expenses by category for the authenticated user' })
  @ApiParam({ name: 'categoryId', description: 'Category ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Returns expenses for the category', type: [ExpenseResponse] })
  async findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number, @Request() req): Promise<ExpenseResponse[]> {
    return this.expensesService.findByCategory(req.user.userId, categoryId);
  }

  @Get('wallet/:walletId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get expenses by wallet for the authenticated user' })
  @ApiParam({ name: 'walletId', description: 'Wallet ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Returns expenses for the wallet', type: [ExpenseResponse] })
  async findByWallet(@Param('walletId', ParseIntPipe) walletId: number, @Request() req): Promise<ExpenseResponse[]> {
    return this.expensesService.findByWallet(req.user.userId, walletId);
  }

  @Get('date-range')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get expenses by date range for the authenticated user' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Returns expenses within the date range', type: [ExpenseResponse] })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ): Promise<ExpenseResponse[]> {
    return this.expensesService.findByDateRange(req.user.userId, startDate, endDate);
  }

  @Get('total/:type')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get total amount by transaction type' })
  @ApiParam({ name: 'type', description: 'Transaction type', enum: ['INCOME', 'EXPENSE'] })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)', example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Returns total amount', schema: { properties: { total: { type: 'number' } } } })
  async getTotalByType(
    @Param('type') type: transaction_type_enum,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ): Promise<{ total: number }> {
    return this.expensesService.getTotalByType(req.user.userId, type, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense by ID' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Expense ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Returns the expense', type: ExpenseResponse })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ExpenseResponse> {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Expense ID', type: 'number' })
  @ApiBody({ type: UpdateExpenseDto, description: 'Expense update data' })
  @ApiResponse({ status: 200, description: 'Expense successfully updated', type: ExpenseResponse })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiResponse({ status: 400, description: 'You do not have permission to update this expense' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req
  ): Promise<ExpenseResponse> {
    return this.expensesService.update(id, updateExpenseDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiParam({ name: 'id', description: 'Expense ID', type: 'number' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Expense successfully deleted' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiResponse({ status: 400, description: 'You do not have permission to delete this expense' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<{ message: string; expense: Partial<ExpenseResponse> }> {
    return this.expensesService.remove(id, req.user.userId);
  }
}
