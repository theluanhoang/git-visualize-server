import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EUserRole } from './user.interface';
import { AuthenticatedUserDto } from '../auth/dto/authenticated-request.dto';
import { UserResponseDto, UserStatsDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getCurrentUserProfile(userId: string): Promise<UserResponseDto> {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const user = await this.getProfile(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateCurrentUserProfile(userId: string, updateData: UpdateProfileDto): Promise<UserResponseDto> {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const updatedUser = await this.updateProfile(userId, updateData);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async getCurrentUserStats(userId: string): Promise<UserStatsDto> {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.getUserStats(userId);
  }

  async getUserByIdWithPermission(targetUserId: string, currentUser: AuthenticatedUserDto): Promise<UserResponseDto> {
    if (!currentUser) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (currentUser.sub !== targetUserId && currentUser.role !== EUserRole.ADMIN) {
      throw new ForbiddenException('Cannot view other user profiles');
    }

    const user = await this.getProfile(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getAllUsersWithPermission(currentUser: AuthenticatedUserDto): Promise<UserResponseDto[]> {
    if (!currentUser) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (currentUser.role !== EUserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return this.findAll();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getProfile(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'avatar',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async updateProfile(id: string, profileData: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): Promise<User | null> {
    await this.userRepository.update(id, profileData);
    return this.getProfile(id);
  }

  async getUserStats(id: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    oauthSessions: number;
    lastLoginAt: Date | null;
  }> {
    return {
      totalSessions: 0,
      activeSessions: 0,
      oauthSessions: 0,
      lastLoginAt: null,
    };
  }
}
