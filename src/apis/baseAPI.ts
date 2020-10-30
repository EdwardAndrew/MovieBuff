import axios from 'axios';
import axiosRetry from 'axios-retry';

import { Message, MessageEmbed } from 'discord.js';

interface APIOptions {
    baseURL: string;
    timeout: number;
    defaultParams?: {
        [key: string]: string;
    }
}

export type APIResponse = {
    embed?: MessageEmbed,
    found: boolean;
}

export abstract class API {
    protected axiosInstance;

    constructor(options: APIOptions) {
        this.axiosInstance = axios.create({
            baseURL: options.baseURL,
            params: options.defaultParams || {},
            timeout: options.timeout
        });
        axiosRetry(this.axiosInstance, { retries: 3 })
    }

    abstract async search(msg: Message): Promise<APIResponse>;

}