import {
    Controller,
    Get,
    Param,
    Query,
    ParseEnumPipe,
    ParseDatePipe,
    UseInterceptors,
    ParseIntPipe, UseGuards, Req
} from '@nestjs/common';
import {SummaryService} from './summary.service';
import {transaction_type_enum} from "@prisma/client";
import {ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth} from '@nestjs/swagger';
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@ApiTags('summary')
@Controller('summary')
export class SummaryController {
    constructor(private readonly summaryService: SummaryService) {
    }

    @Get('/:categoryId/summary-by-month')
    @ApiOperation({summary: 'Get summary for a given month and category'})
    @ApiParam({name: 'categoryId', description: 'Category ID', type: 'number'})
    @ApiQuery({
        name: 'transactionType',
        enum: transaction_type_enum,
        required: true,
        description: 'Transaction type (INCOME | EXPENSE)'
    })
    @ApiQuery({
        name: 'date',
        type: String,
        required: true,
        description: 'Date (ISO string, e.g. 2025-10-01) used to select the month'
    })
    @ApiResponse({status: 200, description: 'Summary returned successfully'})
    @ApiResponse({status: 400, description: 'Bad Request - invalid parameters'})
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    getSummaryByMonthAndCategory(
        @Param('categoryId', ParseIntPipe) categoryId: number,
        @Query('transactionType', new ParseEnumPipe(transaction_type_enum)) transactionType: transaction_type_enum,
        @Query('date', new ParseDatePipe()) date: Date,
        @Req() req
    ) {
        const userId = req.user.userId;
        return this.summaryService.summaryExpenseByMonthAndCategory(userId, categoryId, date, transactionType);
    }
}
