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
    HttpStatus
} from '@nestjs/common';
import {UserService} from './user.service';
import {CreateUserDto} from './dto/create-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody} from '@nestjs/swagger';
import {UserResponse} from './interfaces/user.interface';

@ApiTags('users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {
    }

    @Post()
    @ApiOperation({summary: 'Create a new user'})
    @ApiResponse({status: 201, description: 'User successfully created', type: Object})
    @ApiResponse({status: 409, description: 'Username or email already exists'})
    @ApiBody({type: CreateUserDto, description: 'User creation data'})
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
        return this.userService.create(createUserDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Get all users'})
    @ApiResponse({status: 200, description: 'Returns all users', type: [Object]})
    async findAll(): Promise<UserResponse[]> {
        return this.userService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Get a user by ID'})
    @ApiParam({name: 'id', description: 'User ID', type: 'number'})
    @ApiResponse({status: 200, description: 'Returns the user', type: Object})
    @ApiResponse({status: 404, description: 'User not found'})
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponse> {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Update a user'})
    @ApiParam({name: 'id', description: 'User ID', type: 'number'})
    @ApiBody({type: UpdateUserDto, description: 'User update data'})
    @ApiResponse({status: 200, description: 'User successfully updated', type: Object})
    @ApiResponse({status: 404, description: 'User not found'})
    @ApiResponse({status: 409, description: 'Username or email already exists'})
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto
    ): Promise<UserResponse> {
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Delete a user'})
    @ApiParam({name: 'id', description: 'User ID', type: 'number'})
    @ApiResponse({status: 200, description: 'User successfully deleted'})
    @ApiResponse({status: 404, description: 'User not found'})
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; user: Partial<UserResponse> }> {
        return this.userService.remove(id);
    }
}
