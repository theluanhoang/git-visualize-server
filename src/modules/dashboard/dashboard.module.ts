import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UserModule } from '../users/user.module';
import { LessonModule } from '../lessons/lesson.module';

@Module({
  imports: [UserModule, LessonModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
