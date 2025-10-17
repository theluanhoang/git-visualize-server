import { Injectable } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { LessonService } from '../lessons/lesson.service';
import { DashboardStatsDto } from '../users/dto/analytics.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly userService: UserService,
    private readonly lessonService: LessonService,
  ) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    try {
      const { totalUsers, recentActivity } = await this.userService.getUserAggregateStats();
      
      const { totalLessons, totalViews } = await this.lessonService.getLessonsAggregateStats();
      
      return { totalLessons, totalUsers, totalViews, recentActivity };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalLessons: 0,
        totalUsers: 0,
        totalViews: 0,
        recentActivity: 0
      };
    }
  }
}
