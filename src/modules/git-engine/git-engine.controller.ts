import { Body, Controller, Post } from '@nestjs/common';
import { GitEngineService } from './git-engine.service';
import type { GitCommandRequest, GitCommandResponse } from './git-engine.interface';

@Controller('git')
export class GitEngineController {
    constructor(private readonly gitEngineService: GitEngineService) {}

    @Post('execute')
    executeCommand(@Body() request: GitCommandRequest): GitCommandResponse | null {
        const result = this.gitEngineService.executeCommand(request.command)    
        console.log("RESULT:::", JSON.stringify(result));
            
        return result;
    }
}
