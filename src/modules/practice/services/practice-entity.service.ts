import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { Practice } from '../entities/practice.entity';
import { CreatePracticeDTO } from '../dto/create-practice.dto';
import { UpdatePracticeDTO } from '../dto/update-practice.dto';

/**
 * Service responsible for Practice entity operations only
 * Single Responsibility: Manages Practice CRUD operations
 */
@Injectable()
export class PracticeEntityService {
    constructor(
        @InjectRepository(Practice)
        private readonly practiceRepository: Repository<Practice>
    ) {}

    /**
     * Create a new practice entity
     */
    async create(
        createPracticeDTO: CreatePracticeDTO,
        queryRunner?: QueryRunner
    ): Promise<Practice> {
        const practiceRepo = queryRunner ? queryRunner.manager.getRepository(Practice) : this.practiceRepository;
        
        const practice = practiceRepo.create({
            lessonId: createPracticeDTO.lessonId,
            title: createPracticeDTO.title,
            scenario: createPracticeDTO.scenario,
            difficulty: createPracticeDTO.difficulty || 1,
            estimatedTime: createPracticeDTO.estimatedTime || 0,
            isActive: createPracticeDTO.isActive !== undefined ? createPracticeDTO.isActive : true,
            order: createPracticeDTO.order || 0
        });

        return practiceRepo.save(practice);
    }

    /**
     * Update an existing practice entity
     */
    async update(
        id: string,
        updatePracticeDTO: UpdatePracticeDTO,
        queryRunner?: QueryRunner
    ): Promise<Practice> {
        const practiceRepo = queryRunner ? queryRunner.manager.getRepository(Practice) : this.practiceRepository;
        
        const practice = await practiceRepo.findOne({ where: { id } });
        if (!practice) {
            throw new Error('Practice not found');
        }

        Object.assign(practice, {
            title: updatePracticeDTO.title,
            scenario: updatePracticeDTO.scenario,
            difficulty: updatePracticeDTO.difficulty,
            estimatedTime: updatePracticeDTO.estimatedTime,
            isActive: updatePracticeDTO.isActive,
            order: updatePracticeDTO.order
        });

        return practiceRepo.save(practice);
    }

    /**
     * Find practice by ID
     */
    async findById(id: string, queryRunner?: QueryRunner): Promise<Practice | null> {
        const practiceRepo = queryRunner ? queryRunner.manager.getRepository(Practice) : this.practiceRepository;
        return practiceRepo.findOne({ where: { id } });
    }

    /**
     * Soft delete practice
     */
    async softDelete(id: string, queryRunner?: QueryRunner): Promise<void> {
        const practiceRepo = queryRunner ? queryRunner.manager.getRepository(Practice) : this.practiceRepository;
        const result = await practiceRepo.softDelete({ id });
        if (!result.affected) {
            throw new Error('Practice not found');
        }
    }

    /**
     * Increment views count
     */
    async incrementViews(id: string): Promise<void> {
        await this.practiceRepository.increment({ id }, 'views', 1);
    }

    /**
     * Increment completions count
     */
    async incrementCompletions(id: string): Promise<void> {
        await this.practiceRepository.increment({ id }, 'completions', 1);
    }
}
