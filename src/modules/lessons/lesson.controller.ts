import { Body, Controller, Get, Post, Patch, Param, Query } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CreateLessonDTO } from './dto/create-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons.query.dto';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Lesson } from './lesson.entity';
import { UpdateLessonDTO } from './dto/update-lesson.dto';

@ApiTags('Lessons')
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

    @Patch(':id')
    @ApiOperation({ summary: 'Update a lesson by id' })
    @ApiOkResponse({ description: 'Lesson updated', type: Lesson })
    @ApiBadRequestResponse({ description: 'Validation failed' })
    async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDTO) {
        return this.lessonService.updateLesson(id, dto);
    }
}
