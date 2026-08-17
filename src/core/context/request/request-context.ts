import { AsyncLocalStorage } from "async_hooks";

export interface RequestContext {
    ipAddress: string;
    userAgent: string;
    requestId: string;
    userId?: number;
}

export const storage = new AsyncLocalStorage<RequestContext>();

export const RequestContext = {
    get: () => storage.getStore(),
    storage,
};