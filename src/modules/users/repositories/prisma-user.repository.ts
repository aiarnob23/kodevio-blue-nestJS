import { Injectable } from '@nestjs/common';
import {
  CreateUserInput,
  IUserRepository,
} from '../interfaces/user-repository.interface';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { User } from 'generated/prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}
  // create user
  create(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }
  // find user by email
  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        deletedAt: true,
        isEmailVerified: true,
        status: true,
      },
    });
  }
  // find self profile by id
  getSelfProfileById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }
  // find user by id
  getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isEmailVerified: true,
        status: true,
      },
    });
  }

  //update password
  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  // verify email
  async markEmailVerified(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }
}
