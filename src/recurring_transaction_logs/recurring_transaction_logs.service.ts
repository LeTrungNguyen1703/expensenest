import { Injectable } from '@nestjs/common';
import { CreateRecurringTransactionLogDto } from './dto/create-recurring_transaction_log.dto';
import { UpdateRecurringTransactionLogDto } from './dto/update-recurring_transaction_log.dto';

@Injectable()
export class RecurringTransactionLogsService {
  create(createRecurringTransactionLogDto: CreateRecurringTransactionLogDto) {
    return 'This action adds a new recurringTransactionLog';
  }

  findAll() {
    return `This action returns all recurringTransactionLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} recurringTransactionLog`;
  }

  update(id: number, updateRecurringTransactionLogDto: UpdateRecurringTransactionLogDto) {
    return `This action updates a #${id} recurringTransactionLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} recurringTransactionLog`;
  }
}
