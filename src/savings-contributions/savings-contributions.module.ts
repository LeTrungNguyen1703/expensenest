import { Module } from '@nestjs/common';
import { SavingsContributionsService } from './savings-contributions.service';
import { SavingsContributionsController } from './savings-contributions.controller';

@Module({
  controllers: [SavingsContributionsController],
  providers: [SavingsContributionsService],
})
export class SavingsContributionsModule {}
