import axios from 'axios';
import axiosRetry from 'axios-retry';

import { Message, MessageEmbed } from 'discord.js';
import { config } from '../config';

interface APIOptions {
    baseURL: string;
    timeout: number;
    defaultParams?: {
        [key: string]: string;
    },
    defaultHeaders?: {
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
            headers: options.defaultHeaders || {},
            timeout: options.timeout,
        });
        axiosRetry(this.axiosInstance, { retries: 3 })
    }

    abstract async search(msg: Message): Promise<APIResponse>;

    validateMessageEmbed(embed: MessageEmbed): MessageEmbed {
        embed.title = this.truncateString(embed.title || '', 256);
        embed.description = this.truncateString(embed.description || '', config.MAX_DESCRIPTION_LENGTH);
        embed.fields = embed.fields.map(field => ({
            ...field,
            name: this.truncateString(field.name || '', 50),
            value: this.truncateString(field.value || '', 200)
        })).slice(0, 26);
        if(embed.author?.name) embed.author.name = this.truncateString(embed.author.name || '', 256);
        if (embed.description.length < 10) embed.setDescription('No description is available.');
        return embed;
    };

    private truncateString(string: string, length: number): string {
        return string.length > length ? string.slice(0, length-3).trim().concat('...') : string;
    }
}