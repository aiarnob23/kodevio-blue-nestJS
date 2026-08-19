import { IsString, MinLength, MaxLength, Matches } from "class-validator";

export class ChangePasswordDto {
    @IsString()
    oldPassword: string;

    @IsString()
    @MinLength(6)
    @MaxLength(72)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        { message: 'Password must contain at least one uppercase letter, one lowercase letter and one number' },
    )
    newPassword: string;
}