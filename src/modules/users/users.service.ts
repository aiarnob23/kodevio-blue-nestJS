import { Inject, Injectable } from '@nestjs/common';
import { CreateUserInput, USER_REPOSITORY } from './interfaces/user-repository.interface';
import type { IUserRepository } from './interfaces/user-repository.interface';
import { User } from 'generated/prisma/client';
import { AppLogger } from 'src/core/logging/logger.service';

@Injectable()
export class UsersService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly logger: AppLogger,
    ) { }
    //create user
    async createUser(data: CreateUserInput): Promise<User> {
        this.logger.info(`Creating user, name:${data.firstName} ${data.lastName}, email:${data.email}`);
        const newUser = await this.userRepository.create(data);
        this.logger.info(`User created successfully, id:${newUser.id}, email:${newUser.email}`);
        return newUser;
    }
    //find user by email
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }
    //get self profile details by id
    async getSelfProfileById(id: number): Promise<User | null> {
       return await this.userRepository.getSelfProfileById(id);
    }
    //find user by id
    async getUserById(id: number): Promise<User | null> {
        return this.userRepository.getUserById(id);
    }
    //update password
    async updatePassword(id: number, passwordHash: string): Promise<void> {
        return this.userRepository.updatePassword(id, passwordHash);
    }
    //mark email verified
    async markEmailVerified(id: number): Promise<void> {
        return this.userRepository.markEmailVerified(id);
    }
}
