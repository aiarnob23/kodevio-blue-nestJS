import { Transform } from "class-transformer";
import { IsEmail, IsString, Length } from "class-validator";

export class VerifyEmailDto {
    @Transform(({ value }) => value?.trim().toLowerCase())
    @IsEmail()
    email: string;

    @IsString()
    @Length(6, 6)
    code: string;
}