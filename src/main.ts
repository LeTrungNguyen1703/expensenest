import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {ValidationPipe} from "@nestjs/common";
import {IoAdapter} from "@nestjs/platform-socket.io";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true}));
    app.useWebSocketAdapter(new IoAdapter(app)); // Pass the app instance

    // Swagger setup
    const config = new DocumentBuilder()
        .setTitle('Expense Manager API')
        .setDescription('API documentation for Expense Manager application')
        .setVersion('1.0')
        .addBearerAuth(
            {type: 'http', scheme: 'bearer', bearerFormat: 'JWT'},
            'access-token',
        )
        .addTag('users', 'User management endpoints')
        .addTag('wallets', 'Wallet management endpoints')
        .addTag('categories', 'Category management endpoints')
        .addTag('savings-goals', 'Savings goals management endpoints')
        .addTag('recurring-transactions', 'Recurring transactions management endpoints')
        .addTag('expenses', 'Expense/Income management endpoints')
        .addTag('auth', 'Authentication endpoints')
        .build();

    const document = SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
        deepScanRoutes: true,
    });

    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
        customSiteTitle: 'Expense Manager API Docs',
    });

    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
