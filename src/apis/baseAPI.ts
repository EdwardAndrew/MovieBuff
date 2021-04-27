import axios from 'axios';
import axiosRetry from 'axios-retry';

import { Message, MessageEmbed } from 'discord.js';
import { config } from '../config';
import { cache_hits, cache_misses } from '../metrics';
import { removeHints } from '../utils';
import { redis } from './cache';

interface APIOptions {
    baseURL: string;
    timeout: number;
    name: string;
    defaultParams?: {
        [key: string]: string;
    },
    defaultHeaders?: {
        [key: string]: string;
    },
    cachePrefixes: {
        data: string,
        count: string,
        search: string
    }
}

export type APIResponse = {
    embed?: MessageEmbed,
    found: boolean;
}

export interface DownstreamResponse {
    response: boolean;
    cacheKey: string;
    [key: string]: any;
}

export abstract class API<T extends DownstreamResponse> {
    readonly axiosInstance;
    readonly name;
    readonly searchCachePrefix: string;
    readonly dataCachePrefix: string;
    readonly countCachePrefix: string;

    constructor(options: APIOptions) {
        this.axiosInstance = axios.create({
            baseURL: options.baseURL,
            params: options.defaultParams || {},
            headers: options.defaultHeaders || {},
            timeout: options.timeout,
        });
        axiosRetry(this.axiosInstance, { retries: 3 });
        this.name = options.name;
        this.searchCachePrefix = options.cachePrefixes.search;
        this.dataCachePrefix = options.cachePrefixes.data;
        this.countCachePrefix = options.cachePrefixes.count
    }

    protected abstract getEmbed(data: any, askedBeforeCount: number): MessageEmbed;
    protected abstract apiSearch(searchTerm: string): Promise<T>;

    async search(msg: Message): Promise<APIResponse> {
        const search = removeHints(msg.content)
            .split(' ')
            .slice(1, msg.content.length)
            .join(' ')
            .trim()
            .toLowerCase();

        const serialisedData = await this.getSerializedData(search);
        if (!serialisedData.response) {
            return ({ found: false })
        }
        const askedBeforeCount = await redis.incr(`${this.countCachePrefix}${serialisedData.cacheKey}`);

        return ({
            embed: this.validateMessageEmbed(this.getEmbed(serialisedData, askedBeforeCount)),
            found: true
        })
    }

    private async getSerializedData(search: string): Promise<T> {
        const cacheKey = await redis.get(`${this.searchCachePrefix}${search}`);
        const cachedData = cacheKey ? await redis.get(`${this.dataCachePrefix}${cacheKey}`) : null;
        if (cachedData) {
            this.cacheHitIncrement();
            return JSON.parse(cachedData)
        };
        this.cacheMissIncrement();

        const fetchedData = await this.apiSearch(search);
        if (!fetchedData.response) {
            redis.multi()
                .set(`${this.dataCachePrefix}`, JSON.stringify(fetchedData), 'ex', config.CACHE_NOT_FOUND_TTL)
                .set(`${this.searchCachePrefix}${search}`, '', 'ex', config.CACHE_NOT_FOUND_TTL)
                .exec()
        } else {
            redis.multi()
                .set(`${this.dataCachePrefix}${fetchedData.cacheKey}`, JSON.stringify(fetchedData))
                .set(`${this.searchCachePrefix}${search}`, fetchedData.cacheKey)
                .exec();
        }
        return fetchedData;
    }

    private validateMessageEmbed(embed: MessageEmbed): MessageEmbed {
        embed.title = this.truncateString(embed.title || '', 256);
        embed.description = this.truncateString(embed.description || '', config.MAX_DESCRIPTION_LENGTH);
        embed.fields = embed.fields.map(field => ({
            ...field,
            name: this.truncateString(field.name || '', 50),
            value: this.truncateString(field.value || '', 200)
        })).slice(0, 26);
        if (embed.author?.name) embed.author.name = this.truncateString(embed.author.name || '', 256);
        if (embed.description.length < 10) embed.setDescription('No description is available.');
        return embed;
    };

    private truncateString(string: string, length: number): string {
        return string.length > length ? string.slice(0, length - 3).trim().concat('...') : string;
    }

    private cacheHitIncrement() {
        cache_hits.inc({ api: this.name })
    }

    private cacheMissIncrement() {
        cache_misses.inc({ api: this.name })
    }
}