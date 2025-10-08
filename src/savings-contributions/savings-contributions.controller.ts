import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request} from '@nestjs/common';
import {SavingsContributionsService} from './savings-contributions.service';
import {CreateSavingsContributionDto} from './dto/create-savings-contribution.dto';
import {UpdateSavingsContributionDto} from './dto/update-savings-contribution.dto';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiTags} from '@nestjs/swagger';

@ApiTags('savings-contributions')
@Controller('savings-contributions')
export class SavingsContributionsController {
    constructor(private readonly savingsContributionsService: SavingsContributionsService) {
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Create a savings contribution and update the associated savings goal'})
    @ApiResponse({status: 201, description: 'Savings contribution created and savings goal updated'})
    @ApiBody({type: CreateSavingsContributionDto})
    async create(@Body() createSavingsContributionDto: CreateSavingsContributionDto, @Request() req) {
        return this.savingsContributionsService.create(createSavingsContributionDto, req.user.userId);
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
