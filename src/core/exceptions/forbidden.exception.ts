import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exceptions";

export class ForbiddenException extends AppException {
    constructor(code: string, message: string) {
        super(code, message, HttpStatus.FORBIDDEN);
    }
}