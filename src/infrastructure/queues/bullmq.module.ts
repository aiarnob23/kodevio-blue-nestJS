import { Module, Global } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUES } from './queue.constants';
import { config } from 'src/core/config';

const redisConnection = {
    host: config.redis.host,
    port: config.redis.port,
};

const createQueue = (name: string) => ({
    provide: name,
    useFactory: () => new Queue(name, { connection: redisConnection }),
});

@Global()
@Module({
    providers: [
        createQueue(QUEUES.SESSION),
        createQueue(QUEUES.NOTIFICATION),
    ],
    exports: [
        QUEUES.SESSION,
        QUEUES.NOTIFICATION,
    ],
})
export class BullMQModule {}