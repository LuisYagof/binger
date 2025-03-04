import { getApiKeyFromDb } from "@/db/db";

interface ApiError {
    type: 'API_KEY_MISSING' | 'API_KEY_INVALID' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'UNKNOWN';
    status?: number;
    message: string;
}

export type Result<T> = {
    data: T | null;
    error: ApiError | null;
};

const getValidApiKey = async (): Promise<string | null> => {
    try {
        const apiKey = await getApiKeyFromDb();
        return apiKey;
    } catch (error) {
        console.error('Error getting API key:', error);
        return null;
    }
};

export async function apiRequest<T>(url: string, hasQueryParams: boolean = false): Promise<Result<T>> {
    try {
        const apiKey = await getValidApiKey();
        if (!apiKey) {
            return {
                data: null,
                error: {
                    type: 'API_KEY_MISSING',
                    message: 'No API key found. Please add your TMDB API key in Settings.'
                }
            };
        }

        const apiKeyConcat = hasQueryParams ? '&' : '?';
        const response = await fetch(`${url}${apiKeyConcat}api_key=${apiKey}`);

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    data: null,
                    error: {
                        type: 'API_KEY_INVALID',
                        status: response.status,
                        message: 'Invalid API key. Please check your TMDB API key in Settings.'
                    }
                };
            }

            return {
                data: null,
                error: {
                    type: 'SERVER_ERROR',
                    status: response.status,
                    message: `API request failed with status ${response.status}: ${response.statusText}`
                }
            };
        }

        const data = await response.json();

        if (data.status_code && data.status_message && !data.success) {
            return {
                data: null,
                error: {
                    type: 'SERVER_ERROR',
                    status: data.status_code,
                    message: data.status_message
                }
            };
        }

        return { data, error: null };
    } catch (error) {
        return {
            data: null,
            error: {
                type: 'NETWORK_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        };
    }
}
