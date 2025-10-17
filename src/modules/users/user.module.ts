import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { OAuthProvider } from './oauth-provider.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SessionModule } from '../sessions/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OAuthProvider]),
    SessionModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
