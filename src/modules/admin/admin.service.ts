import { Injectable, NotFoundException } from '@nestjs/common';
import { MailService, MailAttachment } from '../mail/mail.service';
import { UserService } from '../users/user.service';
import { LessonService } from '../lessons/lesson.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly lessonService: LessonService,
  ) {}

  async sendEmailToUser(
    userId: string,
    subject: string,
    message: string,
    attachments: { originalname: string; buffer?: Buffer; mimetype?: string; path?: string }[] = []
  ): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mailAttachments: MailAttachment[] = (attachments || []).map((f) => ({
      filename: f.originalname,
      content: (f.buffer || Buffer.from('')) as Buffer,
      contentType: f.mimetype,
    }));

    await this.mailService.send({
      to: user.email,
      subject,
      text: message,
      html: `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6">${message.replace(/\n/g, '<br/>')}</div>`,
      attachments: mailAttachments,
    });
  }

  async getDashboardStats() {
    const { totalLessons, totalViews } = await this.lessonService.getLessonsAggregateStats();
    const { totalUsers, recentActivity } = await this.userService.getUserAggregateStats();
    return {
      totalLessons,
      totalUsers,
      totalViews,
      recentActivity,
    };
  }
}


