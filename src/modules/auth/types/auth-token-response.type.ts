export type AuthTokenResponse = {
    message: string;
    data: {
        userId: number;
        accessToken?: string;
        refreshToken?: string;
    };
};