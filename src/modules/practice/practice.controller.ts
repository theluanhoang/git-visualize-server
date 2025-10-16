import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { PracticeAggregateService } from './services/practice-aggregate.service';
import { CreatePracticeDTO } from './dto/create-practice.dto';
import { UpdatePracticeDTO } from './dto/update-practice.dto';
import { GetPracticesQueryDto } from './dto/get-practices.query.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RepositoryStateDto } from './dto/repository-state.dto';
import { PracticeRepositoryStateService } from './services/practice-repository-state.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequestDto } from '../auth/dto/authenticated-request.dto';

@ApiTags('Practices')
@Controller('practices')
export class PracticeController {
    constructor(
        private readonly practiceAggregateService: PracticeAggregateService,
        private readonly practiceRepoStateService: PracticeRepositoryStateService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get practices with flexible filtering' })
    @ApiResponse({ status: 200, description: 'List of practices or single practice' })
    async getPractices(@Query() query: GetPracticesQueryDto) {
        return this.practiceAggregateService.getPractices(query);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new practice' })
    @ApiResponse({ status: 201, description: 'The created practice' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async createPractice(@Body() createPracticeDTO: CreatePracticeDTO) {
        return this.practiceAggregateService.createPractice(createPracticeDTO);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an existing practice' })
    @ApiResponse({ status: 200, description: 'The updated practice' })
    @ApiResponse({ status: 404, description: 'Practice not found' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async updatePractice(
        @Param('id') id: string,
        @Body() updatePracticeDTO: UpdatePracticeDTO
    ) {
        return this.practiceAggregateService.updatePractice(id, updatePracticeDTO);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete a practice' })
    @ApiResponse({ status: 200, description: 'Practice successfully deleted' })
    @ApiResponse({ status: 404, description: 'Practice not found' })
    async deletePractice(@Param('id') id: string) {
        return this.practiceAggregateService.deletePractice(id);
    }

    @Post(':id/view')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Increment view count for a practice' })
    @ApiResponse({ status: 204, description: 'View count incremented' })
    async incrementViews(@Param('id') id: string) {
        await this.practiceAggregateService.incrementViews(id);
    }

    @Post(':id/complete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Increment completion count for a practice' })
    @ApiResponse({ status: 204, description: 'Completion count incremented' })
    async incrementCompletions(@Param('id') id: string) {
        await this.practiceAggregateService.incrementCompletions(id);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get(':id/repository-state')
    @ApiOperation({ summary: 'Get current user\'s repository state for this practice' })
    async getRepositoryState(
        @Param('id') id: string,
        @Req() req: AuthenticatedRequestDto,
    ) {
        const userId = req.user.sub;
        return this.practiceRepoStateService.get(id, userId);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Put(':id/repository-state')
    @ApiOperation({ summary: 'Upsert current user\'s repository state for this practice' })
    async upsertRepositoryState(
        @Param('id') id: string,
        @Body() body: RepositoryStateDto & { version?: number },
        @Req() req: AuthenticatedRequestDto,
    ) {
        const userId = req.user.sub;
        return this.practiceRepoStateService.upsert(id, userId, body as any, body.version);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Delete(':id/repository-state')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete current user\'s repository state for this practice' })
    async deleteRepositoryState(
        @Param('id') id: string,
        @Req() req: AuthenticatedRequestDto,
    ) {
        const userId = req.user.sub;
        await this.practiceRepoStateService.remove(id, userId);
    }
}
