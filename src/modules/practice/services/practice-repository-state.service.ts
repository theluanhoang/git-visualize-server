import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeRepositoryState } from '../entities/practice-repository-state.entity';
import type { IRepositoryState } from '../../git-engine/git-engine.interface';

@Injectable()
export class PracticeRepositoryStateService {
  constructor(
    @InjectRepository(PracticeRepositoryState)
    private readonly repo: Repository<PracticeRepositoryState>,
  ) {}

  async get(practiceId: string, userId: string): Promise<{ state: IRepositoryState | null; version: number }> {
    const found = await this.repo.findOne({ where: { practiceId, userId } });
    return {
      state: found ? (found.repositoryState as IRepositoryState) : null,
      version: found?.version || 0
    };
  }

  async upsert(practiceId: string, userId: string, repositoryState: IRepositoryState, clientVersion?: number): Promise<{ state: IRepositoryState; version: number }> {
    const existing = await this.repo.findOne({ where: { practiceId, userId } });
    
    if (existing) {
      if (clientVersion && clientVersion < existing.version) {
        throw new Error(`Version conflict: client version ${clientVersion} is older than server version ${existing.version}`);
      }
      
      existing.repositoryState = repositoryState;
      existing.version += 1;
      existing.lastModifiedBy = 'client';
      await this.repo.save(existing);
      return {
        state: existing.repositoryState as IRepositoryState,
        version: existing.version
      };
    }
    
    const created = this.repo.create({ 
      practiceId, 
      userId, 
      repositoryState,
      version: 1,
      lastModifiedBy: 'client'
    });
    await this.repo.save(created);
    return {
      state: created.repositoryState as IRepositoryState,
      version: created.version
    };
  }

  async remove(practiceId: string, userId: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { practiceId, userId } });
    if (!existing) {
      throw new NotFoundException('Repository state not found');
    }
    await this.repo.delete(existing.id);
  }
}


