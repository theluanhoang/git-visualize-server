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
        
        let lessons: Lesson[];
        let total: number;
        
        if (q) {
            const qb = this.lessonRepository.createQueryBuilder('lesson');
            if (id) qb.andWhere('lesson.id = :id', { id });
            if (slug) qb.andWhere('lesson.slug = :slug', { slug });
            if (status) qb.andWhere('lesson.status = :status', { status });
            qb.andWhere('(lesson.title ILIKE :q OR lesson.description ILIKE :q)', { q: `%${q}%` });
            qb.skip(offset).take(limit).orderBy('lesson.createdAt', 'DESC');
            [lessons, total] = await qb.getManyAndCount();
        } else {
            const where: Record<string, any> = {};
            if (id) where.id = id;
            if (slug) where.slug = slug;
            if (status) where.status = status;
            
            [lessons, total] = await this.lessonRepository.findAndCount({
                where,
                skip: offset,
                take: limit,
                order: { createdAt: 'DESC' },
            });
        }

        if (includePractices) {
            const data = await this.fetchPracticesForLessons(lessons);
            return { data, total, limit, offset } as GetLessonsResponse<LessonWithPractices>;
        }

        return { data: lessons, total, limit, offset } as GetLessonsResponse<Lesson>;
    }


    private async fetchPracticesForLessons(lessons: Lesson[]): Promise<LessonWithPractices[]> {
        return Promise.all(
            lessons.map(async (lesson) => {
                const practices = await this.practiceAggregateService.getPracticesByLessonSlug(lesson.slug);
                return {
                    ...lesson,
                    practices: practices
                } as LessonWithPractices;
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
