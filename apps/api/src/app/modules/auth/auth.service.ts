import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  private accessTtlSeconds = 60 * 15;
  private refreshTtlSeconds = 60 * 60 * 24 * 14;

  private accessSecret =
    process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret_change_me';
  private refreshSecret =
    process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_me';

  constructor(
    private jwt: JwtService,
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.jwt.sign(
      { email: user.email, orgId: user.orgId, role: user.role },
      {
        secret: this.accessSecret,
        expiresIn: this.accessTtlSeconds,
        subject: user.id,
      },
    );

    const refreshToken = this.jwt.sign(
      { email: user.email, orgId: user.orgId, role: user.role },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtlSeconds,
        subject: user.id,
      },
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.users.save(user);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub as string;
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.refreshTokenHash)
      throw new UnauthorizedException('Invalid refresh token');

    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) throw new UnauthorizedException('Invalid refresh token');

    const newAccessToken = this.jwt.sign(
      { email: user.email, orgId: user.orgId, role: user.role },
      {
        secret: this.accessSecret,
        expiresIn: this.accessTtlSeconds,
        subject: user.id,
      },
    );

    return { accessToken: newAccessToken };
  }
}
