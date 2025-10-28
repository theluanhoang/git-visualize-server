import { Module, forwardRef } from '@nestjs/common';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './lesson.entity';
import { PracticeModule } from '../practice/practice.module';
import { ContentExtractionService } from './services/content-extraction.service';
import { GeminiGenerationService } from './services/gemini-generation.service';
import { LessonGenerationService } from './services/lesson-generation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson]),
    forwardRef(() => PracticeModule)
  ],
  controllers: [LessonController],
  providers: [
    LessonService,
    ContentExtractionService,
    GeminiGenerationService,
    LessonGenerationService,
  ],
  exports: [LessonService]
})
export class LessonModule {}
