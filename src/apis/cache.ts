import Redis from 'ioredis';
export const redis = new Redis();

export const prefixes = {
    count: 'moviebuff/count/',
    anime: 'moviebuff/anime-jikan/',
    movie: 'moviebuff/movie-omdb/'
}