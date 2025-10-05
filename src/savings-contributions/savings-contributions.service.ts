import { Injectable } from '@nestjs/common';
import { CreateSavingsContributionDto } from './dto/create-savings-contribution.dto';
import { UpdateSavingsContributionDto } from './dto/update-savings-contribution.dto';

@Injectable()
export class SavingsContributionsService {
  create(createSavingsContributionDto: CreateSavingsContributionDto) {
    return 'This action adds a new savingsContribution';
  }

  findAll() {
    return `This action returns all savingsContributions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} savingsContribution`;
  }

  update(id: number, updateSavingsContributionDto: UpdateSavingsContributionDto) {
    return `This action updates a #${id} savingsContribution`;
  }

  remove(id: number) {
    return `This action removes a #${id} savingsContribution`;
  }
}
