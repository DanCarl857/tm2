import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import type { Role, TaskStatus, TaskCategory } from './models';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['Work', 'Personal'] as const)
  category!: TaskCategory;

  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE'] as const)
  status!: TaskStatus;

  @IsInt()
  @Min(0)
  order!: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(['Work', 'Personal'] as const)
  category?: TaskCategory;

  @IsOptional()
  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE'] as const)
  status?: TaskStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  orgId!: string;

  @IsEnum(['OWNER', 'ADMIN', 'VIEWER'] as const)
  role!: Role;
}
