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
import {UserService} from './user.service';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiUnauthorizedResponse, ApiQuery} from '@nestjs/swagger';
import {UserResponse} from './interfaces/user.interface';
import {PaginationDto} from '../common/dto/pagination.dto';
import {PaginatedResponse} from '../common/interfaces/paginated-response.interface';

@ApiTags('users')
@ApiBearerAuth() // add Bearer auth to Swagger for this controller
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {
    }

    @Post()
    @ApiOperation({summary: 'Create a new user'})
    @ApiResponse({status: 201, description: 'User successfully created', type: UserResponse})
    @ApiResponse({status: 409, description: 'Username or email already exists'})
    @ApiBody({type: CreateUserDto, description: 'User creation data'})
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
        return this.userService.create(createUserDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get all users with pagination'})
    @ApiResponse({status: 200, description: 'Returns paginated users'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'}) // indicate 401 in Swagger
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default 10)' })
    async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponse<UserResponse>> {
        const page = paginationDto.page ?? 1;
        const limit = paginationDto.limit ?? 10;
        return this.userService.findAll(page, limit);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get a user by ID'})
    @ApiParam({name: 'id', description: 'User ID', type: 'number'})
    @ApiResponse({status: 200, description: 'Returns the user', type: UserResponse})
    @ApiResponse({status: 404, description: 'User not found'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponse> {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Update a user'})
    @ApiParam({name: 'id', description: 'User ID', type: 'number'})
    @ApiBody({type: UpdateUserDto, description: 'User update data'})
    @ApiResponse({status: 200, description: 'User successfully updated', type: UserResponse})
    @ApiResponse({status: 404, description: 'User not found'})
    @ApiResponse({status: 409, description: 'Username or email already exists'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
        @Request() req,
    ): Promise<UserResponse> {
        return this.userService.update(id, updateUserDto, req.user.userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Delete a user'})
    @ApiParam({name: 'id', description: 'User ID', type: 'number'})
    @ApiResponse({status: 200, description: 'User successfully deleted'})
    @ApiResponse({status: 404, description: 'User not found'})
    @ApiUnauthorizedResponse({description: 'Unauthorized'})
    @HttpCode(HttpStatus.OK)
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
    ): Promise<{ message: string; user: Partial<UserResponse> }> {
        return this.userService.remove(id, req.user.userId);
    }
}
