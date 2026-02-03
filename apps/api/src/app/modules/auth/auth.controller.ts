import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto, RefreshDto } from '@ckouetchua-87342/data';
import { AuthService } from './auth.service';
import { Public } from '@ckouetchua-87342/auth';

@ApiTags('auth')
@Public()
@Controller('/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('/login')
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('/refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }
}
