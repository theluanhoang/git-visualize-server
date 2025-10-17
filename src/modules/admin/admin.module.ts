import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../users/user.module';
import { MailModule } from '../mail/mail.module';
import { AdminService } from './admin.service';
import { LessonModule } from '../lessons/lesson.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [forwardRef(() => UserModule), MailModule, LessonModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}


