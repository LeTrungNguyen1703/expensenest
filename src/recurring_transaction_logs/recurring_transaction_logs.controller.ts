import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { RecurringTransactionLogsService } from './recurring_transaction_logs.service';
import { CreateRecurringTransactionLogDto } from './dto/create-recurring_transaction_log.dto';
import { UpdateRecurringTransactionLogDto } from './dto/update-recurring_transaction_log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecurringTransactionLogResponse } from './interfaces/recurring-transaction-log.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@ApiTags('recurring-transaction-logs')
@Controller('recurring-transaction-logs')
@UseGuards(JwtAuthGuard)
export class RecurringTransactionLogsController {
  constructor(private readonly recurringTransactionLogsService: RecurringTransactionLogsService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all recurring transaction logs (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of all recurring transaction logs'
  })
  async findAll(
    @Query() paginationDto: PaginationDto
  ): Promise<PaginatedResponse<RecurringTransactionLogResponse>> {
    return this.recurringTransactionLogsService.findAll(
      paginationDto.page,
      paginationDto.limit
    );
  }

  @Get('my-logs')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user\'s recurring transaction logs' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of user\'s recurring transaction logs'
  })
  async findMine(
    @Request() req,
    @Query() paginationDto: PaginationDto
  ): Promise<PaginatedResponse<RecurringTransactionLogResponse>> {
    return this.recurringTransactionLogsService.findByUserId(
      req.user.userId,
      paginationDto.page,
      paginationDto.limit
    );
  }

  @Get('recurring/:recurringId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get logs for a specific recurring transaction' })
  @ApiParam({ name: 'recurringId', description: 'Recurring transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated logs for the recurring transaction'
  })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async findByRecurringId(
    @Param('recurringId', ParseIntPipe) recurringId: number,
    @Request() req,
    @Query() paginationDto: PaginationDto
  ): Promise<PaginatedResponse<RecurringTransactionLogResponse>> {
    return this.recurringTransactionLogsService.findByRecurringId(
      recurringId,
      req.user.userId,
      paginationDto.page,
      paginationDto.limit
    );
  }

  @Get('status/:status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get logs by status' })
  @ApiParam({
    name: 'status',
    description: 'Log status (e.g., PENDING, SUCCESS, FAILED)',
    example: 'PENDING'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated logs with the specified status'
  })
  async findByStatus(
    @Param('status') status: string,
    @Request() req,
    @Query() paginationDto: PaginationDto
  ): Promise<PaginatedResponse<RecurringTransactionLogResponse>> {
    return this.recurringTransactionLogsService.findByStatus(
      status,
      req.user.userId,
      paginationDto.page,
      paginationDto.limit
    );
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a recurring transaction log by ID' })
  @ApiParam({ name: 'id', description: 'Log ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the recurring transaction log',
    type: RecurringTransactionLogResponse
  })
  @ApiResponse({ status: 404, description: 'Log not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<RecurringTransactionLogResponse> {
    return this.recurringTransactionLogsService.findOne(id);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a recurring transaction log' })
  @ApiParam({ name: 'id', description: 'Log ID' })
  @ApiResponse({
    status: 200,
    description: 'Log deleted successfully'
  })
  @ApiResponse({ status: 404, description: 'Log not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<{ message: string; log: Partial<RecurringTransactionLogResponse> }> {
    return this.recurringTransactionLogsService.remove(id, req.user.userId);
  }
}
