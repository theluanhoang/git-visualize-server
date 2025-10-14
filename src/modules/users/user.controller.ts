import { Controller, Get, Put, UseGuards, Req, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthenticatedRequestDto } from '../auth/dto/authenticated-request.dto';
import { UserResponseDto, UserStatsDto } from './dto/user-response.dto';

@ApiTags('User Management')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserById(@Param('id') id: string, @Req() req: AuthenticatedRequestDto): Promise<UserResponseDto> {
    const currentUser = req.user;
    return this.userService.getUserByIdWithPermission(id, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllUsers(@Req() req: AuthenticatedRequestDto): Promise<UserResponseDto[]> {
    const currentUser = req.user;
    return this.userService.getAllUsersWithPermission(currentUser);
  }
}
