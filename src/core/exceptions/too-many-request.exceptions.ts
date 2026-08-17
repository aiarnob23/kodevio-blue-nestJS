import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exceptions";

export class TooManyRequestException extends AppException {
    constructor(code: string, message: string) {
        super(code, message, HttpStatus.TOO_MANY_REQUESTS);
    }
}