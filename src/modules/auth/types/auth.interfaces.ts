export interface RegisterResponse {
    message: string;
    data: {
        userId: number;
        requiredVerification: boolean;
    };
}

export interface AuthTokenResult {
    message: string;
    data: {
        userId: number;
        accessToken: string;
        refreshToken: string;
    };
}

export interface LogoutResponse {
    message: string;
}

export interface SimpleMessageResponse {
    message: string;
}