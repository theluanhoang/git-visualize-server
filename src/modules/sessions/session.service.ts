import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan } from 'typeorm';
import { Session } from './session.entity';
import { SessionType } from './session.interface';
import { DeviceTrackingService } from '../auth/device-tracking.service';
import { ActiveSessionsResponseDto, OAuthSessionsResponseDto } from './dto/session-response.dto';
import { DeviceInfoResponseDto, DeviceInfoDto, LocationInfoDto, DeviceType } from '../auth/dto/device-info.dto';
import * as argon2 from 'argon2';
import { OAuthProviderType } from '../users/oauth.interface';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private deviceTrackingService: DeviceTrackingService,
  ) {}

  async createSession(sessionData: {
    userId: string;
    refreshTokenHash: string;
    userAgent?: string;
    ip?: string;
    expiresAt: Date;
    sessionType?: SessionType;
    oauthProvider?: string;
    oauthProviderId?: string;
    oauthAccessTokenHash?: string;
    oauthRefreshTokenHash?: string;
    oauthTokenExpiresAt?: Date;
  }): Promise<Session> {
    const session = this.sessionRepository.create({
      userId: sessionData.userId,
      refreshTokenHash: sessionData.refreshTokenHash,
      userAgent: sessionData.userAgent || null,
      ip: sessionData.ip || null,
      expiresAt: sessionData.expiresAt,
      revokedAt: null,
      sessionType: sessionData.sessionType || SessionType.PASSWORD,
      oauthProvider: sessionData.oauthProvider as any,
      oauthProviderId: sessionData.oauthProviderId,
      oauthAccessTokenHash: sessionData.oauthAccessTokenHash,
      oauthRefreshTokenHash: sessionData.oauthRefreshTokenHash,
      oauthTokenExpiresAt: sessionData.oauthTokenExpiresAt,
    });
    return this.sessionRepository.save(session);
  }

  async findActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId, revokedAt: IsNull() }
    });
  }

  async findSessionByRefreshToken(userId: string, refreshToken: string): Promise<Session | null> {
    const activeSessions = await this.findActiveSessions(userId);
    
    for (const session of activeSessions) {
      try {
        const isValid = await argon2.verify(session.refreshTokenHash, refreshToken);
        if (isValid) {
          return session;
        }
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }

  async revokeSessionByRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const session = await this.findSessionByRefreshToken(userId, refreshToken);
    if (!session) {
      return false;
    }

    session.revokedAt = new Date();
    await this.sessionRepository.save(session);
    return true;
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.sessionRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() }
    );
  }

  async getActiveSessionsWithDetails(userId: string): Promise<ActiveSessionsResponseDto> {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const sessions = await this.getActiveSessionsForUser(userId);
    
    return {
      sessions: sessions.map(session => ({
        id: session.id,
        sessionType: session.sessionType,
        oauthProvider: session.oauthProvider,
        userAgent: session.userAgent,
        ip: session.ip,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isActive: session.expiresAt > new Date() && !session.revokedAt,
      })),
      total: sessions.length,
    };
  }

  async getOAuthSessionsWithDetails(userId: string): Promise<OAuthSessionsResponseDto> {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const sessions = await this.getOAuthSessionsForUser(userId);
    
    return {
      sessions: sessions.map(session => ({
        id: session.id,
        sessionType: session.sessionType,
        oauthProvider: session.oauthProvider,
        oauthProviderId: session.oauthProviderId,
        userAgent: session.userAgent,
        ip: session.ip,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        oauthTokenExpiresAt: session.oauthTokenExpiresAt,
        isActive: session.expiresAt > new Date() && !session.revokedAt,
      })),
      total: sessions.length,
    };
  }

  async getDeviceInfo(userAgent?: string, ip?: string): Promise<DeviceInfoResponseDto> {
    if (!userAgent) {
      return { error: 'User-Agent not available' };
    }

    const deviceInfo = this.deviceTrackingService.parseUserAgent(userAgent);
    const locationInfo = await this.deviceTrackingService.getLocationFromIP(ip || '');
    
    const deviceDto: DeviceInfoDto = {
      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      deviceType: deviceInfo.deviceType as DeviceType,
      isBot: deviceInfo.isBot,
    };
    
    const locationDto: LocationInfoDto = {
      country: locationInfo.country,
      city: locationInfo.city,
      region: locationInfo.region,
      timezone: locationInfo.timezone,
      isp: locationInfo.isp,
    };
    
    return {
      device: deviceDto,
      location: locationDto,
      ip,
      userAgent,
    };
  }

  async getActiveSessionsForUser(userId: string) {
    return this.sessionRepository.find({
      where: { 
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date())
      },
      order: { createdAt: 'DESC' }
    });
  }

  async getOAuthSessionsForUser(userId: string) {
    return this.sessionRepository.find({
      where: { 
        userId,
        sessionType: SessionType.OAUTH,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date())
      },
      order: { createdAt: 'DESC' }
    });
  }

  async getSessionById(sessionId: string) {
    return this.sessionRepository.findOne({
      where: { id: sessionId }
    });
  }

  async revokeSession(sessionId: string) {
    return this.sessionRepository.update(sessionId, {
      revokedAt: new Date()
    });
  }

  async getSessionsByOAuthProvider(userId: string, provider: string) {
    return this.sessionRepository.find({
      where: { 
        userId,
        oauthProvider: provider as OAuthProviderType,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date())
      },
      order: { createdAt: 'DESC' }
    });
  }

  async getSessionStats(userId: string) {
    const [total, active, oauth, password] = await Promise.all([
      this.sessionRepository.count({ where: { userId } }),
      this.sessionRepository.count({ 
        where: { 
          userId, 
          revokedAt: IsNull(), 
          expiresAt: MoreThan(new Date()) 
        } 
      }),
      this.sessionRepository.count({ 
        where: { 
          userId, 
          sessionType: SessionType.OAUTH,
          revokedAt: IsNull(), 
          expiresAt: MoreThan(new Date()) 
        } 
      }),
      this.sessionRepository.count({ 
        where: { 
          userId, 
          sessionType: SessionType.PASSWORD,
          revokedAt: IsNull(), 
          expiresAt: MoreThan(new Date()) 
        } 
      }),
    ]);

    return {
      total,
      active,
      oauth,
      password,
      revoked: total - active,
    };
  }
}
