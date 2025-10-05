import { Test, TestingModule } from '@nestjs/testing';
import { SavingsContributionsService } from './savings-contributions.service';

describe('SavingsContributionsService', () => {
  let service: SavingsContributionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavingsContributionsService],
    }).compile();

    service = module.get<SavingsContributionsService>(SavingsContributionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
