import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GitEngineModule } from './modules/git-engine/git-engine.module';

@Module({
  imports: [GitEngineModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
