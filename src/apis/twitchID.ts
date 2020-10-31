import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '../config';

interface TwitchIDAPIOptions {
    baseURL: string;
    timeout: number;
    defaultParams?: {
        [key: string]: string;
    }
}

class TwitchIDAPI {
    private readonly axiosInstance: AxiosInstance;
    private accessToken: string = '';
    private tokenExpires: number = 0;
    constructor(options: TwitchIDAPIOptions){
        this.axiosInstance = axios.create({
            baseURL: options.baseURL,
            params: options.defaultParams || {},
            timeout: options.timeout
        });
        axiosRetry(this.axiosInstance, { retries: 3 })
    };

    async auth() {
        try {
            const { data } = await this.axiosInstance.post('oauth2/token', {}, {
                 params: {
                     client_id: config.Twitch.CLIENT_ID,
                     client_secret: config.Twitch.CLIENT_SECRET,
                     grant_type: 'client_credentials'
                 }
             });
     
             if(data.access_token) this.accessToken = data.access_token;
             if(data.expires_in) this.tokenExpires = Date.now()+((data.expires_in-600)*1000);
        } catch(err){
            console.error('Twitch Authentication failed');
            throw err;
        }
        console.log('Authenticated with Twitch');
    }

    async getToken(): Promise<string> {
        if(this.tokenExpires <= Date.now()){
            await this.auth();
        }
        return this.accessToken
    }
}

export const twitch = new TwitchIDAPI({
    baseURL: config.Twitch.BASE_URL,
    timeout: config.API_TIMEOUT,
});