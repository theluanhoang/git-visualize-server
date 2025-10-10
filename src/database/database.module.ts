import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('database.host'),
        port: config.getOrThrow<number>('database.port'),
        username: config.getOrThrow<string>('database.username'),
        password: config.getOrThrow<string>('database.password'),
        database: config.getOrThrow<string>('database.database'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: config.get<boolean>('database.migrationsRun'),
        logging: config.get<boolean>('database.logging'),
        migrations: ['dist/migrations/*.js'],
        // Keep snake_case naming if needed later via custom naming strategy
      }),
    }),
  ],
})
export class DatabaseModule {}


