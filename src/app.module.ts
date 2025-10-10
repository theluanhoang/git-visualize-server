import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LessonModule } from './modules/lessons/lesson.module';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { envValidationSchema } from './config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
        '.env.local',
      ],
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    LessonModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
