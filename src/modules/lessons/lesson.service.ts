import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Lesson } from './lesson.entity';
import { Repository } from 'typeorm';
import { CreateLessonDTO } from './dto/create-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons.query.dto';
import { UpdateLessonDTO } from './dto/update-lesson.dto';
import { PracticeAggregateService } from '../practice/services/practice-aggregate.service';
import { 
  LessonWithPractices, 
  GetLessonsResponse,
} from './types';

@Injectable()
export class LessonService {
    constructor(
        @InjectRepository(Lesson)
        private readonly lessonRepository: Repository<Lesson>,
        @Inject(forwardRef(() => PracticeAggregateService))
        private readonly practiceAggregateService: PracticeAggregateService,
    ) {}


    async getLessonsAggregateStats(): Promise<{ totalLessons: number; totalViews: number }>{
        const qb = this.lessonRepository.createQueryBuilder('lesson');
        const countRow = await qb
            .clone()
            .select('COUNT(lesson.id)', 'count')
            .getRawOne<{ count: string }>();
        const sumRow = await qb
            .clone()
            .select('COALESCE(SUM(lesson.views), 0)', 'sum')
            .getRawOne<{ sum: string }>();
        return {
            totalLessons: Number(countRow?.count ?? 0),
            totalViews: Number(sumRow?.sum ?? 0),
        };
    }

    async getLessons(query: GetLessonsQueryDto): Promise<GetLessonsResponse<Lesson | LessonWithPractices>>{
        const { limit = 20, offset = 0, id, slug, status, q, includePractices = false } = query;
        
        const baseQb = this.lessonRepository.createQueryBuilder('lesson');
        
        if (id) baseQb.andWhere('lesson.id = :id', { id });
        if (slug) baseQb.andWhere('lesson.slug = :slug', { slug });
        if (status) baseQb.andWhere('lesson.status = :status', { status });
        if (q) {
            baseQb.andWhere('(lesson.title ILIKE :q OR lesson.description ILIKE :q)', { q: `%${q}%` });
        }

        const countQb = baseQb.clone().select('COUNT(DISTINCT lesson.id)', 'count');
        const totalResult = await countQb.getRawOne<{ count: string }>();
        const total = parseInt(totalResult?.count || '0', 10);

        const dataQb = baseQb
            .clone()
            .addSelect('COALESCE(AVG(rating.rating), 0)', 'averageRating')
            .leftJoin('rating', 'rating', 'rating.lesson_id = lesson.id')
            .groupBy('lesson.id')
            .skip(offset)
            .take(limit)
            .orderBy('lesson.createdAt', 'DESC');

        const { entities, raw } = await dataQb.getRawAndEntities();

        const lessonsWithRatings = entities.map((lesson, index) => {
            (lesson as any).averageRating = parseFloat(raw[index].averageRating) || 0;
            return lesson;
        }) as (Lesson & { averageRating: number })[];

        if (includePractices) {
            const data = await this.fetchPracticesForLessons(lessonsWithRatings);
            return { data, total, limit, offset } as GetLessonsResponse<LessonWithPractices & { averageRating?: number }>;
        }

        return { data: lessonsWithRatings, total, limit, offset } as GetLessonsResponse<Lesson & { averageRating: number }>;
    }


    private async fetchPracticesForLessons(lessons: (Lesson & { averageRating?: number })[]): Promise<(LessonWithPractices & { averageRating?: number })[]> {
        return Promise.all(
            lessons.map(async (lesson) => {
                const practices = await this.practiceAggregateService.getPracticesByLessonSlug(lesson.slug);
                return {
                    ...lesson,
                    practices: practices,
                    averageRating: lesson.averageRating
                } as LessonWithPractices & { averageRating?: number };
            })
        );
    }

    async createLesson(createLessonDTO: CreateLessonDTO): Promise<Lesson> {
        return this.lessonRepository.save(createLessonDTO);
    }

    async updateLesson(id: string, dto: UpdateLessonDTO): Promise<Lesson> {
        const existing = await this.lessonRepository.findOne({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Lesson not found');
        }
        const merged = this.lessonRepository.merge(existing, dto);
        return this.lessonRepository.save(merged);
    }

  async deleteLesson(id: string): Promise<{ success: true }>{
    const result = await this.lessonRepository.softDelete({ id });
    if (!result.affected) {
      throw new NotFoundException('Lesson not found');
    }
    return { success: true };
  }

  async updateLessonViews(lessonId: string, views: number): Promise<void> {
    await this.lessonRepository.update(
      { id: lessonId },
      { views },
    );
  }
}
