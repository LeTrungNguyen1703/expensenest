import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    Request
} from '@nestjs/common';
import {RecurringTransactionsService} from './recurring-transactions.service';
import {CreateRecurringTransactionDto} from './dto/create-recurring-transaction.dto';
import {UpdateRecurringTransactionDto} from './dto/update-recurring-transaction.dto';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth} from '@nestjs/swagger';
import {RecurringTransactionResponse} from './interfaces/recurring-transaction.interface';
import {transaction_type_enum} from '@prisma/client';

@ApiTags('recurring-transactions')
@Controller('recurring-transactions')
@UseGuards(JwtAuthGuard)
export class RecurringTransactionsController {
    constructor(private readonly recurringTransactionsService: RecurringTransactionsService) {
    }

    @Post()
    @ApiOperation({summary: 'Create a new recurring transaction'})
    @ApiResponse({
        status: 201,
        description: 'Recurring transaction successfully created',
        type: RecurringTransactionResponse
    })
    @ApiResponse({status: 404, description: 'Category or Wallet not found'})
    @ApiBody({type: CreateRecurringTransactionDto, description: 'Recurring transaction creation data'})
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createRecurringTransactionDto: CreateRecurringTransactionDto, @Request() req): Promise<RecurringTransactionResponse> {
        return this.recurringTransactionsService.create(createRecurringTransactionDto, req.user.userId);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get all recurring transactions'})
    @ApiResponse({status: 200, description: 'Returns all recurring transactions', type: [RecurringTransactionResponse]})
    async findAll(): Promise<RecurringTransactionResponse[]> {
        return this.recurringTransactionsService.findAll();
    }

    @Get('my-transactions')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get all recurring transactions for the authenticated user'})
    @ApiResponse({
        status: 200,
        description: 'Returns user recurring transactions',
        type: [RecurringTransactionResponse]
    })
    async findByUserId(@Request() req): Promise<RecurringTransactionResponse[]> {
        return this.recurringTransactionsService.findByUserId(req.user.userId);
    }

    @Get('active')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get all active recurring transactions for the authenticated user'})
    @ApiResponse({
        status: 200,
        description: 'Returns active recurring transactions',
        type: [RecurringTransactionResponse]
    })
    async findActive(@Request() req): Promise<RecurringTransactionResponse[]> {
        return this.recurringTransactionsService.findActive(req.user.userId);
    }

    @Get('type/:type')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get recurring transactions by type for the authenticated user'})
    @ApiParam({name: 'type', description: 'Transaction type', enum: ['INCOME', 'EXPENSE']})
    @ApiResponse({
        status: 200,
        description: 'Returns recurring transactions of the specified type',
        type: [RecurringTransactionResponse]
    })
    async findByType(@Param('type') type: transaction_type_enum, @Request() req): Promise<RecurringTransactionResponse[]> {
        return this.recurringTransactionsService.findByType(req.user.userId, type);
    }

    @Get(':id')
    @ApiOperation({summary: 'Get a recurring transaction by ID'})
    @ApiBearerAuth('access-token')
    @ApiParam({name: 'id', description: 'Recurring Transaction ID', type: 'number'})
    @ApiResponse({status: 200, description: 'Returns the recurring transaction', type: RecurringTransactionResponse})
    @ApiResponse({status: 404, description: 'Recurring transaction not found'})
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<RecurringTransactionResponse> {
        return this.recurringTransactionsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({summary: 'Update a recurring transaction'})
    @ApiBearerAuth('access-token')
    @ApiParam({name: 'id', description: 'Recurring Transaction ID', type: 'number'})
    @ApiBody({type: UpdateRecurringTransactionDto, description: 'Recurring transaction update data'})
    @ApiResponse({
        status: 200,
        description: 'Recurring transaction successfully updated',
        type: RecurringTransactionResponse
    })
    @ApiResponse({status: 404, description: 'Recurring transaction not found'})
    @ApiResponse({status: 400, description: 'You do not have permission to update this recurring transaction'})
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRecurringTransactionDto: UpdateRecurringTransactionDto,
        @Request() req
    ): Promise<RecurringTransactionResponse> {
        return this.recurringTransactionsService.update(id, updateRecurringTransactionDto, req.user.userId);
    }

    @Patch(':id/toggle-active')
    @ApiOperation({summary: 'Toggle active status of a recurring transaction'})
    @ApiBearerAuth('access-token')
    @ApiParam({name: 'id', description: 'Recurring Transaction ID', type: 'number'})
    @ApiResponse({status: 200, description: 'Active status toggled successfully', type: RecurringTransactionResponse})
    @ApiResponse({status: 404, description: 'Recurring transaction not found'})
    @ApiResponse({status: 400, description: 'You do not have permission to update this recurring transaction'})
    async toggleActive(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<RecurringTransactionResponse> {
        return this.recurringTransactionsService.toggleActive(id, req.user.userId);
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete a recurring transaction'})
    @ApiParam({name: 'id', description: 'Recurring Transaction ID', type: 'number'})
    @ApiBearerAuth('access-token')
    @ApiResponse({status: 200, description: 'Recurring transaction successfully deleted'})
    @ApiResponse({status: 404, description: 'Recurring transaction not found'})
    @ApiResponse({status: 400, description: 'You do not have permission to delete this recurring transaction'})
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<{
        message: string;
        transaction: Partial<RecurringTransactionResponse>
    }> {
        return this.recurringTransactionsService.remove(id, req.user.userId);
    }
}
