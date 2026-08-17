import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exceptions";

export class NotFoundException extends AppException {
    constructor(code: string, message: string) {
        super(code, message, HttpStatus.NOT_FOUND);
    }
}