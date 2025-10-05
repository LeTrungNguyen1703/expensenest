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
    Request
} from '@nestjs/common';
import {CategoriesService} from './categories.service';
import {CreateCategoryDto} from './dto/create-category.dto';
import {UpdateCategoryDto} from './dto/update-category.dto';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth} from '@nestjs/swagger';
import {CategoryResponse} from './interfaces/category.interface';
import {transaction_type_enum} from '@prisma/client';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {
    }

    @Post()
    @ApiOperation({summary: 'Create a new category'})
    @ApiResponse({status: 201, description: 'Category successfully created', type: CategoryResponse})
    @ApiResponse({status: 404, description: 'User not found'})
    @ApiBody({type: CreateCategoryDto, description: 'Category creation data'})
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponse> {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get all categories'})
    @ApiResponse({status: 200, description: 'Returns all categories', type: [CategoryResponse]})
    async findAll(): Promise<CategoryResponse[]> {
        return this.categoriesService.findAll();
    }

    @Get('user')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get all categories for the authenticated user (including system categories)'})
    @ApiResponse({status: 200, description: 'Returns user categories and system categories', type: [CategoryResponse]})
    async findByUserId(@Request() req): Promise<CategoryResponse[]> {
        console.log(req.user);
        return this.categoriesService.findByUserId(req.user.userId);
    }

    @Get('type/:type')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get categories by transaction type'})
    @ApiParam({name: 'type', description: 'Transaction type', enum: ['INCOME', 'EXPENSE']})
    @ApiResponse({status: 200, description: 'Returns categories of the specified type', type: [CategoryResponse]})
    async findByType(@Param('type') type: transaction_type_enum): Promise<CategoryResponse[]> {
        return this.categoriesService.findByType(type);
    }

    @Get(':id')
    @ApiOperation({summary: 'Get a category by ID'})
    @ApiBearerAuth('access-token')
    @ApiParam({name: 'id', description: 'Category ID', type: 'number'})
    @ApiResponse({status: 200, description: 'Returns the category', type: CategoryResponse})
    @ApiResponse({status: 404, description: 'Category not found'})
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<CategoryResponse> {
        return this.categoriesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({summary: 'Update a category'})
    @ApiBearerAuth('access-token')
    @ApiParam({name: 'id', description: 'Category ID', type: 'number'})
    @ApiBody({type: UpdateCategoryDto, description: 'Category update data'})
    @ApiResponse({status: 200, description: 'Category successfully updated', type: CategoryResponse})
    @ApiResponse({status: 404, description: 'Category not found'})
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCategoryDto: UpdateCategoryDto
    ): Promise<CategoryResponse> {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete a category'})
    @ApiParam({name: 'id', description: 'Category ID', type: 'number'})
    @ApiBearerAuth('access-token')
    @ApiResponse({status: 200, description: 'Category successfully deleted'})
    @ApiResponse({status: 404, description: 'Category not found'})
    @ApiResponse({status: 409, description: 'Cannot delete category that is being used'})
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<{
        message: string;
        category: Partial<CategoryResponse>
    }> {
        return this.categoriesService.remove(id);
    }
}
