import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../users/user.entity';
import { Session } from './session.entity'
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Session) private readonly sessionRepository: Repository<Session>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string) {
    const exists = await this.userRepository.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = this.userRepository.create({ email, passwordHash, role: 'USER' });
    await this.userRepository.save(user);
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string, userAgent?: string, ip?: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    const refreshTokenHash = await argon2.hash(tokens.refreshToken, { type: argon2.argon2id });
    const session = this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash,
      userAgent: userAgent || null,
      ip: ip || null,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });
    await this.sessionRepository.save(session);
    return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
  }

  private async generateTokens(user: User) {
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
    const activeSessions = await this.sessionRepository.find({ where: { userId, revokedAt: IsNull() } });
    const match = await Promise.any(
      activeSessions.map(async (s) => (await argon2.verify(s.refreshTokenHash, refreshToken)) ? s : null)
    ).catch(() => null);
    if (!match) throw new UnauthorizedException('Invalid refresh');

    match.revokedAt = new Date();
    await this.sessionRepository.save(match);

    const user = await this.userRepository.findOneByOrFail({ id: userId });
    const tokens = await this.generateTokens(user);
    const newHash = await argon2.hash(tokens.refreshToken, { type: argon2.argon2id });
    const session = this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash: newHash,
      userAgent: userAgent || null,
      ip: ip || null,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });
    await this.sessionRepository.save(session);
    return tokens;
  }

  async logout(userId: string, refreshToken: string) {
    const sessions = await this.sessionRepository.find({ where: { userId, revokedAt: IsNull() } });
    for (const s of sessions) {
      const ok = await argon2.verify(s.refreshTokenHash, refreshToken).catch(() => false);
      if (ok) {
        s.revokedAt = new Date();
        await this.sessionRepository.save(s);
        return { success: true };
      }
    }
    return { success: true };
  }
}


