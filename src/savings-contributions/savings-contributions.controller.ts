import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query} from '@nestjs/common';
import {SavingsContributionsService} from './savings-contributions.service';
import {CreateSavingsContributionDto} from './dto/create-savings-contribution.dto';
import {UpdateSavingsContributionDto} from './dto/update-savings-contribution.dto';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiTags, ApiQuery} from '@nestjs/swagger';
import {PaginationDto} from '../common/dto/pagination.dto';

@ApiTags('savings-contributions')
@UseGuards(JwtAuthGuard)
@Controller('savings-contributions')
export class SavingsContributionsController {
    constructor(private readonly savingsContributionsService: SavingsContributionsService) {
    }

    @Post()
    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Create a savings contribution and update the associated savings goal'})
    @ApiResponse({status: 201, description: 'Savings contribution created and savings goal updated'})
    @ApiBody({type: CreateSavingsContributionDto})
    async create(@Body() createSavingsContributionDto: CreateSavingsContributionDto, @Request() req) {
        return this.savingsContributionsService.create(createSavingsContributionDto, req.user.userId);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'List all savings contributions (admin) with pagination'})
    @ApiResponse({status: 200, description: 'Paginated list of savings contributions'})
    @ApiQuery({name: 'page', required: false})
    @ApiQuery({name: 'limit', required: false})
    async findAll(@Query() paginationDto: PaginationDto) {
        return this.savingsContributionsService.findAll(paginationDto);
    }

    @Get('my-contributions')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'List authenticated user\'s savings contributions with pagination'})
    @ApiResponse({status: 200, description: 'Paginated list of user savings contributions'})
    @ApiQuery({name: 'page', required: false})
    @ApiQuery({name: 'limit', required: false})
    async findMine(@Request() req, @Query() paginationDto: PaginationDto) {
        return this.savingsContributionsService.findByUserId(req.user.userId, paginationDto);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get a single savings contribution by ID'})
    @ApiResponse({status: 200, description: 'Savings contribution record'})
    async findOne(@Param('id') id: string) {
        return this.savingsContributionsService.findOne(+id);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Update a savings contribution (ownership required)'})
    @ApiResponse({status: 200, description: 'Updated savings contribution'})
    async update(@Param('id') id: string, @Body() updateSavingsContributionDto: UpdateSavingsContributionDto, @Request() req) {
        return this.savingsContributionsService.update(+id, updateSavingsContributionDto, req.user.userId);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Delete a savings contribution (ownership required)'})
    @ApiResponse({status: 200, description: 'Deletion result'})
    async remove(@Param('id') id: string, @Request() req) {
        return this.savingsContributionsService.remove(+id, req.user.userId);
    }
}
