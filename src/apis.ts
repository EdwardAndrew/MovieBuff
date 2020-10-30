import axios from 'axios';

import { config } from './config';

export const apis = {
    omdb: axios.create({
        baseURL: 'https://www.omdbapi.com/',
        timeout: config.API_TIMEOUT,
        params: {
            apikey: config.OMDB.API_KEY
        },
    }),
    jikan: axios.create({
        baseURL: 'https://api.jikan.moe/v3',
        timeout: config.API_TIMEOUT,
        params: {
        },
    })
}