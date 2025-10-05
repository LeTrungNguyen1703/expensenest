import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SavingsContributionsService } from './savings-contributions.service';
import { CreateSavingsContributionDto } from './dto/create-savings-contribution.dto';
import { UpdateSavingsContributionDto } from './dto/update-savings-contribution.dto';

@Controller('savings-contributions')
export class SavingsContributionsController {
  constructor(private readonly savingsContributionsService: SavingsContributionsService) {}

  @Post()
  create(@Body() createSavingsContributionDto: CreateSavingsContributionDto) {
    return this.savingsContributionsService.create(createSavingsContributionDto);
  }

  @Get()
  findAll() {
    return this.savingsContributionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.savingsContributionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSavingsContributionDto: UpdateSavingsContributionDto) {
    return this.savingsContributionsService.update(+id, updateSavingsContributionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.savingsContributionsService.remove(+id);
  }
}
