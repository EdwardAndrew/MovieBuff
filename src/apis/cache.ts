import Redis from 'ioredis';
import { config } from '../config';
export const redis = new Redis();

const globalPrefix = config.CACHE_GLOBAL_PREFIX;

export const cachePrefixes = {
    count: `${globalPrefix}count/`,
    anime: `${globalPrefix}anime-jikan/`,
    movie: `${globalPrefix}movie-omdb/`,
    game:  `${globalPrefix}game-igdb/`,
}