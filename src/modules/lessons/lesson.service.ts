import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Lesson } from './lesson.entity';
import { Like, Repository } from 'typeorm';
import { CreateLessonDTO } from './dto/create-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons.query.dto';
import { UpdateLessonDTO } from './dto/update-lesson.dto';

@Injectable()
export class LessonService {
    constructor(
        @InjectRepository(Lesson)
        private readonly lessonRepository: Repository<Lesson>,
    ) {}

    async getLessons(query: GetLessonsQueryDto): Promise<{ data: Lesson[]; total: number; limit: number; offset: number; }>{
        const { limit = 20, offset = 0, id, slug, status, q } = query;
        const where: Record<string, any> = {};
        if (id) where.id = id;
        if (slug) where.slug = slug;
        if (status) where.status = status;
        if (q) {
            const qb = this.lessonRepository.createQueryBuilder('lesson');
            if (id) qb.andWhere('lesson.id = :id', { id });
            if (slug) qb.andWhere('lesson.slug = :slug', { slug });
            if (status) qb.andWhere('lesson.status = :status', { status });
            qb.andWhere('(lesson.title ILIKE :q OR lesson.description ILIKE :q)', { q: `%${q}%` });
            qb.skip(offset).take(limit).orderBy('lesson.createdAt', 'DESC');
            const [data, total] = await qb.getManyAndCount();
            return { data, total, limit, offset };
        }
        const [data, total] = await this.lessonRepository.findAndCount({
            where,
            skip: offset,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return { data, total, limit, offset };
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
}
