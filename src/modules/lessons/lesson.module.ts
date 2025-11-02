import { Module, forwardRef } from '@nestjs/common';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './lesson.entity';
import { LessonView } from './lesson-view.entity';
import { PracticeModule } from '../practice/practice.module';
import { ContentExtractionService } from './services/content-extraction.service';
import { GeminiGenerationService } from './services/gemini-generation.service';
import { LessonGenerationService } from './services/lesson-generation.service';
import { LessonViewService } from './lesson-view.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, LessonView]),
    forwardRef(() => PracticeModule)
  ],
  controllers: [LessonController],
  providers: [
    LessonService,
    LessonViewService,
    ContentExtractionService,
    GeminiGenerationService,
    LessonGenerationService,
  ],
  exports: [LessonService, LessonViewService]
})
export class LessonModule {}
