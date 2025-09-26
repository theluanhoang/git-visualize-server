import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true
  });
  await app.listen(process.env.PORT ?? 8000, () => {
    console.log("Git Visualized Backend is running on http://localhost:8000");
  });
}
bootstrap();
