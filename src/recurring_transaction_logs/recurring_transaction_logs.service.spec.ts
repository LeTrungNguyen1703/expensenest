import { Test, TestingModule } from '@nestjs/testing';
import { RecurringTransactionLogsService } from './recurring_transaction_logs.service';

describe('RecurringTransactionLogsService', () => {
  let service: RecurringTransactionLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringTransactionLogsService],
    }).compile();

    service = module.get<RecurringTransactionLogsService>(RecurringTransactionLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
