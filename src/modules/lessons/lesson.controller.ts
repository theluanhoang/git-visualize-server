import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CreateLessonDTO } from './dto/create-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons.query.dto';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Lesson } from './lesson.entity';

@ApiTags('lessons')
@Controller('lesson')
export class LessonController {
    constructor(private readonly lessonService: LessonService) {}

    @Get()
    @ApiOkResponse({ description: 'List lessons with pagination' })
    async getLessons(@Query() query: GetLessonsQueryDto) {
        return this.lessonService.getLessons(query);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new lesson' })
    @ApiCreatedResponse({ description: 'Lesson created', type: Lesson })
    @ApiBadRequestResponse({ description: 'Validation failed' })
    async createLesson(@Body() createGitTheoryDto: CreateLessonDTO) {
        return this.lessonService.createLesson(createGitTheoryDto);
    }
}
