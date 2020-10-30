export const config = {
    OMDB: {
        API_KEY: process.env['OMDB_API_KEY'],
        BASE_URL: 'https://www.omdbapi.com/',
    },
    Jikan: {
        BASE_URL: 'https://api.jikan.moe/v3'
    },
    DISCORD_TOKEN: process.env['DISCORD_TOKEN'],
    API_TIMEOUT: 2500,
    CACHE_NOT_FOUND_TTL: 24 * 60 * 60,
    MAX_DESCRIPTION_LENGTH: 990,
}