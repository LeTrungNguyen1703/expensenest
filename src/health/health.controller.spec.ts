import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthIndicator } from './redis.health';
import { ConfigService } from '@nestjs/config';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule, HttpModule],
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
        RedisHealthIndicator,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });


  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have check method', () => {
    expect(controller.check).toBeDefined();
  });

  it('should have checkReadiness method', () => {
    expect(controller.checkReadiness).toBeDefined();
  });

  it('should have checkLiveness method', () => {
    expect(controller.checkLiveness).toBeDefined();
  });
});

