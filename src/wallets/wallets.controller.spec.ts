import {Test, TestingModule} from '@nestjs/testing';
import {WalletsController} from './wallets.controller';
import {WalletsService} from './wallets.service';
import {PrismaService} from '../prisma/prisma.service';

describe('WalletsController', () => {
    let controller: WalletsController;
    let walletsService: WalletsService;

    beforeEach(async () => {
        const mockWalletService = {
            wallets: {
                create: jest.fn(),
                findAll: jest.fn(),
                findOne: jest.fn(),
                findByUserId: jest.fn(),
                update: jest.fn(),
                updateBalance: jest.fn(),
                delete: jest.fn(),
            }
        }

        const module: TestingModule = await Test.createTestingModule({
            controllers: [WalletsController],
            providers: [
                WalletsService,
                {
                    provide: WalletsService,
                    useValue: mockWalletService,
                },
            ],
        }).compile();

        controller = module.get<WalletsController>(WalletsController);
        walletsService = module.get<WalletsService>(WalletsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // it('should return all wallets', async () => {
    //   const mockWallets = [
    //     { id: 1, wallet_name: 'Wallet 1', balance: 100, user_id: 1 },
    //     { id: 2, wallet_name: 'Wallet 2', balance: 200, user_id: 1 },
    //   ];
    //
    //   // Mock Prisma
    //   prisma.wallets.findMany.mockResolvedValue(mockWallets);
    //
    //   // Gọi controller
    //   const result = await controller.findAll(); // (tùy tên hàm thật trong controller)
    //
    //   // Kiểm tra kết quả
    //   expect(result).toEqual(mockWallets);
    //   expect(prisma.wallets.findMany).toHaveBeenCalled();
    // });

    it('should created wallet', async () => {
        const mockWallet = {wallet_id: 1, wallet_name: 'Wallet 1', balance: 100, user_id: 1};

        // Arrange: Mock service
        walletsService.create = jest.fn().mockResolvedValue(mockWallet);

        // Arrange: Input data
        const createWalletDto = {wallet_name: 'Wallet 1', balance: 100};
        const req = {user: {userId: 1}};

        // Act: Call controller
        const result = await controller.create(createWalletDto, req);

        // Assert: Check result
        expect(result).toEqual(mockWallet);
        expect(walletsService.create).toHaveBeenCalledWith(createWalletDto, req.user.userId);
    });

    it('should return wallet by id', async () => {
        const mockWallet = {wallet_id: 1, wallet_name: 'Wallet 1', balance: 100, user_id: 1};

        // Arrange: Mock service
        walletsService.findOne = jest.fn().mockResolvedValue(mockWallet);

        // Arrange: Input data
        const walletId = 1;

        // Act: Call controller
        const result = await controller.findOne(walletId);

        // Assert: Check result
        expect(result).toEqual(mockWallet);
        expect(walletsService.findOne).toHaveBeenCalledWith(walletId);

    })

});
