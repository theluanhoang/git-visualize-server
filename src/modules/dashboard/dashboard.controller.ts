import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ForAdmin } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { AuthenticatedRequestDto } from '../auth/dto/authenticated-request.dto';
import { DashboardStatsDto } from '../users/dto/analytics.dto';

@ApiTags('Dashboard Analytics')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully', type: DashboardStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ForAdmin()
  async getDashboardStats(@Req() req: AuthenticatedRequestDto): Promise<DashboardStatsDto> {
    return this.dashboardService.getDashboardStats();
  }
}
