import { Transform } from "class-transformer";
import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
    @Transform(({ value }) => value?.trim().toLowerCase())
    @IsEmail()
    email: string;

    @IsString()
    @Length(6, 6)
    code: string;

    @IsString()
    @MinLength(6)
    @MaxLength(72)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        { message: 'Password must contain at least one uppercase letter, one lowercase letter and one number' },
    )
    newPassword: string;
}