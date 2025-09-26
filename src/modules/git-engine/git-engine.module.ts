import { Module } from '@nestjs/common';
import { GitEngineController } from './git-engine.controller';
import { GitEngineService } from './git-engine.service';

@Module({
  controllers: [GitEngineController],
  providers: [GitEngineService]
})
export class GitEngineModule {}
