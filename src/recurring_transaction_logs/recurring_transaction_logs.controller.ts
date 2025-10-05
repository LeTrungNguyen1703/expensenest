import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RecurringTransactionLogsService } from './recurring_transaction_logs.service';
import { CreateRecurringTransactionLogDto } from './dto/create-recurring_transaction_log.dto';
import { UpdateRecurringTransactionLogDto } from './dto/update-recurring_transaction_log.dto';

@Controller('recurring-transaction-logs')
export class RecurringTransactionLogsController {
  constructor(private readonly recurringTransactionLogsService: RecurringTransactionLogsService) {}

  @Post()
  create(@Body() createRecurringTransactionLogDto: CreateRecurringTransactionLogDto) {
    return this.recurringTransactionLogsService.create(createRecurringTransactionLogDto);
  }

  @Get()
  findAll() {
    return this.recurringTransactionLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recurringTransactionLogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRecurringTransactionLogDto: UpdateRecurringTransactionLogDto) {
    return this.recurringTransactionLogsService.update(+id, updateRecurringTransactionLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recurringTransactionLogsService.remove(+id);
  }
}
