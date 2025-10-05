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
import {WalletsService} from './wallets.service';
import {CreateWalletDto} from './dto/create-wallet.dto';
import {UpdateWalletDto} from './dto/update-wallet.dto';
import {UpdateBalanceDto} from './dto/update-balance.dto';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth} from '@nestjs/swagger';
import {WalletResponse} from './interfaces/wallet.interface';

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) {
    }

    @Post()
    @ApiOperation({summary: 'Create a new wallet'})
    @ApiResponse({status: 201, description: 'Wallet successfully created', type: WalletResponse})
    @ApiResponse({status: 404, description: 'User not found'})
    @ApiBody({type: CreateWalletDto, description: 'Wallet creation data'})
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createWalletDto: CreateWalletDto): Promise<WalletResponse> {
        return this.walletsService.create(createWalletDto);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get all wallets'})
    @ApiResponse({status: 200, description: 'Returns all wallets', type: [WalletResponse]})
    async findAll(): Promise<WalletResponse[]> {
        return this.walletsService.findAll();
    }

    @Get('user')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Get all wallets for the authenticated user'})
    @ApiResponse({status: 200, description: 'Returns all wallets for the user', type: [WalletResponse]})
    async findByUserId(@Request() req): Promise<WalletResponse[]> {
        return this.walletsService.findByUserId(req.user.userId);
    }

    @Get(':id')
    @ApiOperation({summary: 'Get a wallet by ID'})
    @ApiBearerAuth('access-token')
    @ApiParam({name: 'id', description: 'Wallet ID', type: 'number'})
    @ApiResponse({status: 200, description: 'Returns the wallet', type: WalletResponse})
    @ApiResponse({status: 404, description: 'Wallet not found'})
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<WalletResponse> {
        return this.walletsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({summary: 'Update a wallet'})
    @ApiBearerAuth('access-token')
    @ApiParam({name: 'id', description: 'Wallet ID', type: 'number'})
    @ApiBody({type: UpdateWalletDto, description: 'Wallet update data'})
    @ApiResponse({status: 200, description: 'Wallet successfully updated', type: WalletResponse})
    @ApiResponse({status: 404, description: 'Wallet not found'})
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateWalletDto: UpdateWalletDto
    ): Promise<WalletResponse> {
        return this.walletsService.update(id, updateWalletDto);
    }

    @Patch(':id/balance')
    @ApiOperation({summary: 'Update wallet balance (increment/decrement)'})
    @ApiBearerAuth('access-token')
    @ApiParam({name: 'id', description: 'Wallet ID', type: 'number'})
    @ApiBody({type: UpdateBalanceDto, description: 'Amount to update balance'})
    @ApiResponse({status: 200, description: 'Wallet balance successfully updated', type: WalletResponse})
    @ApiResponse({status: 404, description: 'Wallet not found'})
    async updateBalance(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateBalanceDto: UpdateBalanceDto
    ): Promise<WalletResponse> {
        return this.walletsService.updateBalance(id, updateBalanceDto.amount);
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete a wallet'})
    @ApiParam({name: 'id', description: 'Wallet ID', type: 'number'})
    @ApiBearerAuth('access-token')
    @ApiResponse({status: 200, description: 'Wallet successfully deleted'})
    @ApiResponse({status: 404, description: 'Wallet not found'})
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; wallet: Partial<WalletResponse> }> {
        return this.walletsService.remove(id);
    }
}
