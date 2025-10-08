import { Module } from '@nestjs/common';
import { RecurringTransactionLogsService } from './recurring_transaction_logs.service';
import { RecurringTransactionLogsController } from './recurring_transaction_logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecurringTransactionLogsController],
  providers: [RecurringTransactionLogsService],
  exports: [RecurringTransactionLogsService],
})
export class RecurringTransactionLogsModule {}
