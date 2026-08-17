import { User } from 'generated/prisma/client';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  passwordHash: string;
  emailVerifiedAt?: Date | null;
}

export interface IUserRepository {
  create(data: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<any>;
  getSelfProfileById(id: number): Promise<any>;
  getUserById(id: number): Promise<any>;
  updatePassword(id: number, passwordHash: string): Promise<void>;
  markEmailVerified(id: number): Promise<void>;
  //updateUser(id: number, data: any): Promise<User>;
}
