import { Module, forwardRef } from '@nestjs/common';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './lesson.entity';
import { PracticeModule } from '../practice/practice.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson]),
    forwardRef(() => PracticeModule)
  ],
  controllers: [LessonController],
  providers: [LessonService],
  exports: [LessonService]
})
export class LessonModule {}
