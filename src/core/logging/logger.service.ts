import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import chalk from 'chalk';
import { format as dateFnsFormat } from 'date-fns';
import { config } from '../config';

const { combine, timestamp, printf, errors, json } = format;

const LOG_DIR = 'logs';

const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const styles: Record<string, { emoji: string; color: (msg: string) => string }> = {
        error: { emoji: '❌', color: chalk.red.bold },
        warn:  { emoji: '⚠️ ', color: chalk.yellow.bold },
        info:  { emoji: 'ℹ️ ', color: chalk.cyan.bold },
        http:  { emoji: '🌐', color: chalk.magenta.bold },
        debug: { emoji: '🐛', color: chalk.green },
    };

    const style = styles[level] ?? { emoji: '📝', color: chalk.white };
    const time = chalk.dim(timestamp as string);
    const lvl = style.color(level.toUpperCase().padEnd(7));

    // ignore password and refreshToken
    const { password, refreshToken, ...safeMeta } = meta as any;
    const metaStr = Object.keys(safeMeta).length
        ? chalk.gray(JSON.stringify(safeMeta))
        : '';

    return `${style.emoji} ${time} ${lvl} ${stack || message} ${metaStr}`;
});

@Injectable()
export class AppLogger implements LoggerService {
    private readonly logger: Logger;

    constructor() {
        this.logger = createLogger({
            level: config.logging.level ?? 'info',
            exitOnError: false,
            format: combine(
                errors({ stack: true }),
                timestamp({
                    format: () => dateFnsFormat(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS'),
                }),
            ),
            transports: [
                new transports.Console({
                    format: combine(consoleFormat),
                }),
                new DailyRotateFile({
                    dirname: LOG_DIR,
                    filename: 'app-%DATE%.json',
                    datePattern: 'YYYY-MM-DD',
                    maxFiles: '14d',
                    maxSize: '5m',
                    format: combine(json()),
                }),
            ],
            exceptionHandlers: [
                new DailyRotateFile({
                    dirname: LOG_DIR,
                    filename: 'exceptions-%DATE%.json',
                    datePattern: 'YYYY-MM-DD',
                    format: combine(json()),
                }),
            ],
            rejectionHandlers: [
                new DailyRotateFile({
                    dirname: LOG_DIR,
                    filename: 'rejections-%DATE%.json',
                    datePattern: 'YYYY-MM-DD',
                    format: combine(json()),
                }),
            ],
        });
    }

    // ── NestJS LoggerService interface ──────────────────
    log(message: string, context?: string) {
        this.logger.info(message, { context });
    }
    error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { trace, context });
    }
    warn(message: string, context?: string) {
        this.logger.warn(message, { context });
    }
    debug(message: string, context?: string) {
        this.logger.debug(message, { context });
    }
    verbose(message: string, context?: string) {
        this.logger.verbose(message, { context });
    }

    // ── Manual log — for custom logging ──────────────────
    info(msg: string, meta?: object) {
        this.logger.info(msg, meta);
    }

    http(msg: string, meta?: object) {
        this.logger.http(msg, meta);
    }

    logError(msg: string, meta?: object) {  
    this.logger.error(msg, meta);
}
}