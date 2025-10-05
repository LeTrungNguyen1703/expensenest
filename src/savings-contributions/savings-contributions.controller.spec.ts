import { Test, TestingModule } from '@nestjs/testing';
import { SavingsContributionsController } from './savings-contributions.controller';
import { SavingsContributionsService } from './savings-contributions.service';

describe('SavingsContributionsController', () => {
  let controller: SavingsContributionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavingsContributionsController],
      providers: [SavingsContributionsService],
    }).compile();

    controller = module.get<SavingsContributionsController>(SavingsContributionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
