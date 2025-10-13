import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
  Query,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BudgetResponse } from './interfaces/budget.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@ApiTags('budgets')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget successfully created', type: BudgetResponse })
  @ApiResponse({ status: 404, description: 'User or Category not found' })
  @ApiBody({ type: CreateBudgetDto })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBudgetDto: CreateBudgetDto, @Request() req): Promise<BudgetResponse> {
    return this.budgetsService.create(createBudgetDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets (admin) with pagination' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Returns paginated budgets' })
  async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<BudgetResponse>> {
    return this.budgetsService.findAll(paginationDto.page, paginationDto.limit);
  }

  @Get('user')
  @ApiOperation({ summary: "Get authenticated user's budgets with pagination" })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Returns paginated budgets for the user' })
  async findByUserId(@Request() req, @Query() paginationDto: PaginationDto): Promise<PaginatedResponse<BudgetResponse>> {
    return this.budgetsService.findByUserId(req.user.userId, paginationDto.page, paginationDto.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a budget by ID' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Budget ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Returns the budget', type: BudgetResponse })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BudgetResponse> {
    return this.budgetsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Budget ID', type: 'number' })
  @ApiBody({ type: UpdateBudgetDto })
  @ApiResponse({ status: 200, description: 'Budget successfully updated', type: BudgetResponse })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateBudgetDto: UpdateBudgetDto, @Request() req): Promise<BudgetResponse> {
    return this.budgetsService.update(id, updateBudgetDto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiParam({ name: 'id', description: 'Budget ID', type: 'number' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Budget successfully deleted' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<{ message: string; budget: Partial<BudgetResponse> }> {
    return this.budgetsService.remove(id, req.user.userId);
  }
}
