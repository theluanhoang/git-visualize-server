import { Body, Controller, Get, Headers, Ip, Post, Req } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiHeader } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthenticatedRequestDto } from './dto/authenticated-request.dto';

@ApiTags('Auth')
@Controller('/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User created' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email/password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Return access and refresh tokens' })
  @ApiHeader({ name: 'user-agent', required: false, description: 'Override UA for testing in Swagger' })
  login(@Body() dto: LoginDto, @Headers('user-agent') ua: string, @Ip() ip: string) {
    return this.auth.login(dto.email, dto.password, ua, ip);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh tokens (rotation)' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'New access/refresh tokens' })
  @ApiHeader({ name: 'user-agent', required: false, description: 'Override UA for testing in Swagger' })
  refresh(@Body() body: RefreshDto, @Headers('user-agent') ua: string, @Ip() ip: string) {
    const { userId, refreshToken } = body || {};
    return this.auth.refresh(userId, refreshToken, ua, ip);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (revoke current refresh token)' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'Revoked' })
  logout(@Body() body: RefreshDto) {
    const { userId, refreshToken } = body || {};
    return this.auth.logout(userId, refreshToken);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user from access token' })
  @ApiResponse({ status: 200, description: 'User information retrieved successfully' })
  me(@Req() req: AuthenticatedRequestDto) {
    return req.user || null;
  }
}


