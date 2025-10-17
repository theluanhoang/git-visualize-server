import { Controller, Get, Put, UseGuards, Req, Body, Param, Header, Query, Delete, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ForAdmin } from '../auth/decorators/roles.decorator';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthenticatedRequestDto } from '../auth/dto/authenticated-request.dto';
import { UserResponseDto, UserStatsDto } from './dto/user-response.dto';
import { UsersResponseDto } from './dto/analytics.dto';
import { GetUsersQueryDto } from './user.interface';

@ApiTags('User Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getCurrentUser(@Req() req: AuthenticatedRequestDto): Promise<UserResponseDto> {
    const userId = req.user?.sub;
    return this.userService.getCurrentUserProfile(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCurrentUser(@Req() req: AuthenticatedRequestDto, @Body() updateData: UpdateProfileDto): Promise<UserResponseDto> {
    const userId = req.user?.sub;
    return this.userService.updateCurrentUserProfile(userId, updateData);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully', type: UserStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserStats(@Req() req: AuthenticatedRequestDto): Promise<UserStatsDto> {
    const userId = req.user?.sub;
    return this.userService.getCurrentUserStats(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering (admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: UsersResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by role' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order' })
  @ForAdmin()
  async getAllUsers(
    @Req() req: AuthenticatedRequestDto,
    @Query() query: GetUsersQueryDto
  ): Promise<UsersResponseDto> {
    return this.userService.getUsers(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user status (admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ForAdmin()
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @Req() req: AuthenticatedRequestDto
  ): Promise<UserResponseDto> {
    return this.userService.updateUserStatus(id, body.isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ForAdmin()
  async deleteUser(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequestDto
  ): Promise<{ message: string }> {
    await this.userService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }
}
