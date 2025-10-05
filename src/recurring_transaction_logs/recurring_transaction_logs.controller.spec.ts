import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransactionLogsController } from './recurring_transaction_logs.controller';
import { RecurringTransactionLogsService } from './recurring_transaction_logs.service';

describe('RecurringTransactionLogsController', () => {
  let controller: RecurringTransactionLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringTransactionLogsController],
      providers: [RecurringTransactionLogsService],
    }).compile();

    controller = module.get<RecurringTransactionLogsController>(RecurringTransactionLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
