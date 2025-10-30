import { Body, Controller, Get, Post, Patch, Param, Query, Delete, UseInterceptors, UploadedFile, BadRequestException, ValidationPipe, UsePipes } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LessonService } from './lesson.service';
import { CreateLessonDTO } from './dto/create-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons.query.dto';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { Lesson } from './lesson.entity';
import { UpdateLessonDTO } from './dto/update-lesson.dto';
import { GetLessonsResponse, LessonWithPractices } from './types';
import { GenerateLessonResponseDto, Language, ModelType, OutlineStyle, SourceType } from './dto/generate-lesson.dto';
import { GenerateLessonMultipartDto } from './dto/generate-lesson-multipart.dto';
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
    @UseInterceptors(FileInterceptor('file'))
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({ summary: 'Generate lesson content from URL or file' })
    @ApiConsumes('multipart/form-data', 'application/json')
    @ApiOkResponse({ description: 'Lesson content generated successfully', type: GenerateLessonResponseDto })
    @ApiBadRequestResponse({ description: 'Invalid input or generation failed' })
    async generateLesson(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: GenerateLessonMultipartDto,
    ): Promise<GenerateLessonResponseDto> {     
        const { sourceType, url, language, model, outlineStyle, additionalInstructions } = body;

        if (sourceType === SourceType.FILE) {
            if (!file) {
                throw new BadRequestException('File is required when sourceType is file');
            }
            return this.lessonGenerationService.generateLesson({
                sourceType,
                fileBuffer: file.buffer,
                fileName: file.originalname,
                language: language || Language.VI,
                model: model || ModelType.GEMINI_FLASH,
                outlineStyle: outlineStyle || OutlineStyle.DETAILED,
                additionalInstructions,
            });
        } else if (sourceType === SourceType.URL) {
            if (!url) {
                throw new BadRequestException('URL is required when sourceType is url');
            }
            return this.lessonGenerationService.generateLesson({
                sourceType,
                url,
                language: language || Language.VI,
                model: model || ModelType.GEMINI_FLASH,
                outlineStyle: outlineStyle || OutlineStyle.DETAILED,
                additionalInstructions,
            });
        } else {
            throw new BadRequestException('Invalid source type');
        }
    }
}
