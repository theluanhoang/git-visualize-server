import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { SessionService } from '../sessions/session.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionType } from '../sessions/session.interface';
import { EUserRole } from '../users/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string) {
    const exists = await this.userService.findByEmail(email);
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await this.userService.create({ 
      email, 
      passwordHash, 
      role: EUserRole.USER,
      isActive: true 
    });
    
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string, userAgent?: string, ip?: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.passwordHash) {
      return false;
    }
    
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    const refreshTokenHash = await argon2.hash(tokens.refreshToken, { type: argon2.argon2id });
    
    await this.sessionService.createSession({
      userId: user.id,
      refreshTokenHash,
      userAgent: userAgent || undefined,
      ip: ip || undefined,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      sessionType: SessionType.PASSWORD,
    });
    
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  private async generateTokens(user: { id: string; email: string; role: string }) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { expiresIn: this.config.get('auth.accessTtl', '15m'), secret: this.config.get('auth.jwtAccessSecret') },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, typ: 'refresh' },
      { expiresIn: this.config.get('auth.refreshTtl', '14d'), secret: this.config.get('auth.jwtRefreshSecret') },
    );
    return { accessToken, refreshToken };
  }

  async refresh(userId: string, refreshToken: string, userAgent?: string, ip?: string) {
    const session = await this.sessionService.findSessionByRefreshToken(userId, refreshToken);
    if (!session) throw new UnauthorizedException('Invalid refresh token');

    await this.sessionService.revokeSession(session.id);

    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const tokens = await this.generateTokens(user);
    const newHash = await argon2.hash(tokens.refreshToken, { type: argon2.argon2id });
    
    await this.sessionService.createSession({
      userId: user.id,
      refreshTokenHash: newHash,
      userAgent: userAgent || undefined,
      ip: ip || undefined,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      sessionType: SessionType.PASSWORD,
    });
    
    return tokens;
  }

  async logout(userId: string, refreshToken: string) {
    const success = await this.sessionService.revokeSessionByRefreshToken(userId, refreshToken);
    return { success };
  }
}


