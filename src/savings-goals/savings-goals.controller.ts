import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, HttpCode, HttpStatus, Request, Query } from '@nestjs/common';
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SavingsGoalResponse } from './interfaces/savings-goal.interface';
import { goal_status_enum } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@ApiTags('savings-goals')
@Controller('savings-goals')
@UseGuards(JwtAuthGuard)
export class SavingsGoalsController {
  constructor(private readonly savingsGoalsService: SavingsGoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new savings goal' })
  @ApiResponse({ status: 201, description: 'Savings goal successfully created', type: SavingsGoalResponse })
  @ApiResponse({ status: 404, description: 'User or Wallet not found' })
  @ApiBody({ type: CreateSavingsGoalDto, description: 'Savings goal creation data' })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSavingsGoalDto: CreateSavingsGoalDto, @Request() req): Promise<SavingsGoalResponse> {
    return this.savingsGoalsService.create(createSavingsGoalDto, req.user.userId);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all savings goals (admin) with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated savings goals' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 10)' })
  async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<SavingsGoalResponse>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    return this.savingsGoalsService.findAll(page, limit);
  }

  @Get('my-goals')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all savings goals for the authenticated user with pagination' })
  @ApiResponse({ status: 200, description: 'Returns user savings goals', type: [SavingsGoalResponse] })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 10)' })
  async findByUserId(@Request() req, @Query() paginationDto: PaginationDto): Promise<PaginatedResponse<SavingsGoalResponse>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    return this.savingsGoalsService.findByUserId(req.user.userId, page, limit);
  }

  @Get('status/:status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get savings goals by status for the authenticated user with pagination' })
  @ApiParam({ name: 'status', description: 'Goal status', enum: ['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'] })
  @ApiResponse({ status: 200, description: 'Returns savings goals with the specified status', type: [SavingsGoalResponse] })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 10)' })
  async findByStatus(@Param('status') status: goal_status_enum, @Request() req, @Query() paginationDto: PaginationDto): Promise<PaginatedResponse<SavingsGoalResponse>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    return this.savingsGoalsService.findByStatus(req.user.userId, status, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a savings goal by ID' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Savings Goal ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Returns the savings goal', type: SavingsGoalResponse })
  @ApiResponse({ status: 404, description: 'Savings goal not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SavingsGoalResponse> {
    return this.savingsGoalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a savings goal' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Savings Goal ID', type: 'number' })
  @ApiBody({ type: UpdateSavingsGoalDto, description: 'Savings goal update data' })
  @ApiResponse({ status: 200, description: 'Savings goal successfully updated', type: SavingsGoalResponse })
  @ApiResponse({ status: 404, description: 'Savings goal not found' })
  @ApiResponse({ status: 400, description: 'You do not have permission to update this goal' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSavingsGoalDto: UpdateSavingsGoalDto,
    @Request() req
  ): Promise<SavingsGoalResponse> {
    return this.savingsGoalsService.update(id, updateSavingsGoalDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a savings goal' })
  @ApiParam({ name: 'id', description: 'Savings Goal ID', type: 'number' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Savings goal successfully deleted' })
  @ApiResponse({ status: 404, description: 'Savings goal not found' })
  @ApiResponse({ status: 400, description: 'You do not have permission to delete this goal' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<{ message: string; goal: Partial<SavingsGoalResponse> }> {
    return this.savingsGoalsService.remove(id, req.user.userId);
  }
}
