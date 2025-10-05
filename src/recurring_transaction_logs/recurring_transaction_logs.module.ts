import { Module } from '@nestjs/common';
import { RecurringTransactionLogsService } from './recurring_transaction_logs.service';
import { RecurringTransactionLogsController } from './recurring_transaction_logs.controller';

@Module({
  controllers: [RecurringTransactionLogsController],
  providers: [RecurringTransactionLogsService],
})
export class RecurringTransactionLogsModule {}
