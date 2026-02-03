import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
  ) {}

  async createUser(
    email: string,
    password: string,
    orgId: string,
    role: 'OWNER' | 'ADMIN' | 'VIEWER',
  ) {
    const u = this.users.create({
      email,
      passwordHash: await bcrypt.hash(password, 10),
      orgId,
      role,
      refreshTokenHash: null,
    });
    return this.users.save(u);
  }
}
