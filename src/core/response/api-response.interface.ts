
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T | null;
    timestamp: string;
    path?: string;
}