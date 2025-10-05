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
        .setTitle('Task Manager API')
        .setDescription('API documentation for Task Manager V2')
        .setVersion('1.0')
        .addBearerAuth(
            {type: 'http', scheme: 'bearer', bearerFormat: 'JWT'},
            'access-token',
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
