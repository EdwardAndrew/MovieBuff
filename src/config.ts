export const config = {
    OMDB: {
        API_KEY: process.env['OMDB_API_KEY'],
        BASE_URL: 'https://www.omdbapi.com/',
    },
    Jikan: {
        BASE_URL: 'https://api.jikan.moe/v3/'
    },
    Twitch: {
        BASE_URL: "https://id.twitch.tv/",
        CLIENT_ID: process.env['TWITCH_CLIENT_ID'],
        CLIENT_SECRET: process.env['TWITCH_CLIENT_SECRET']   
    },
    IGDB: {
        BASE_URL: "https://api.igdb.com/v4",
    },
    DISCORD_TOKEN: process.env['DISCORD_TOKEN'],
    API_TIMEOUT: 2500,
    CACHE_NOT_FOUND_TTL: 24 * 60 * 60,
    CACHE_GLOBAL_PREFIX: 'moviebuff/',
    MAX_DESCRIPTION_LENGTH: 990,
    COMMAND_PREFIX: '!mb',
}