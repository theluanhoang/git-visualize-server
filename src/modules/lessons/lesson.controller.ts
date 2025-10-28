import { Body, Controller, Get, Post, Patch, Param, Query, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LessonService } from './lesson.service';
import { CreateLessonDTO } from './dto/create-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons.query.dto';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Lesson } from './lesson.entity';
import { UpdateLessonDTO } from './dto/update-lesson.dto';
import { GetLessonsResponse, LessonWithPractices } from './types';
import { GenerateLessonDto, GenerateLessonResponseDto, Language, ModelType, OutlineStyle } from './dto/generate-lesson.dto';
import { LessonGenerationService } from './services/lesson-generation.service';

@ApiTags('Lessons')
@Controller('lesson')
export class LessonController {
    constructor(
        private readonly lessonService: LessonService,
        private readonly lessonGenerationService: LessonGenerationService,
    ) {}

    @Get()
    @ApiOkResponse({ description: 'List lessons with pagination' })
    async getLessons(@Query() query: GetLessonsQueryDto): Promise<GetLessonsResponse<Lesson | LessonWithPractices>> {
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

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a lesson by id (soft delete)' })
    @ApiOkResponse({ description: 'Lesson deleted' })
    async deleteLesson(@Param('id') id: string) {
        return this.lessonService.deleteLesson(id);
    }

    @Post('generate')
    @ApiOperation({ summary: 'Generate lesson content from URL or file' })
    @ApiOkResponse({ description: 'Lesson content generated successfully', type: GenerateLessonResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid input or generation failed' })
    async generateLesson(@Body() dto: GenerateLessonDto): Promise<GenerateLessonResponseDto> {
        return this.lessonGenerationService.generateLesson(dto);
    }

    @Post('generate/upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Generate lesson content from uploaded file' })
    @ApiConsumes('multipart/form-data')
    @ApiOkResponse({ description: 'Lesson content generated successfully', type: GenerateLessonResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid file or generation failed' })
    async generateLessonFromFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: {
            language?: Language;
            model?: ModelType;
            outlineStyle?: OutlineStyle;
            additionalInstructions?: string;
        },
    ): Promise<GenerateLessonResponseDto> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        return this.lessonGenerationService.generateLessonFromFile(
            file.buffer,
            file.originalname,
            body.language || Language.VI,
            body.model || ModelType.GEMINI_FLASH,
            body.outlineStyle || OutlineStyle.DETAILED,
            body.additionalInstructions,
        );
    }
}
