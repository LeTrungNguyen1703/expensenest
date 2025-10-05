import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {jwtConstants} from "./auth/constants";
import {ConfigModule} from "@nestjs/config";
import {CacheModule} from "@nestjs/cache-manager";
import {CacheableMemory, Keyv} from "cacheable";
import KeyvRedis from "@keyv/redis";
import {BullModule} from "@nestjs/bullmq";
import {UserModule} from './user/user.module';
import {PrismaModule} from "./prisma/prisma.module";

@Module({
    imports: [ConfigModule.forRoot({
        isGlobal: true,
        cache: true,
        load: [jwtConstants],
    }),
        CacheModule.registerAsync({
            isGlobal: true,
            useFactory: async () => {
                return {
                    stores: [
                        new Keyv({
                            store: new CacheableMemory({ttl: 60000, lruSize: 5000}),
                        }),
                        new KeyvRedis('redis://localhost:6379'),
                    ],
                };
            },
        }),
        BullModule.forRoot({
            connection: {
                host: 'localhost',
                port: 6379,
            },
        }),
        UserModule,
        PrismaModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}
