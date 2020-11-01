import { RSA_PSS_SALTLEN_DIGEST } from "constants";
import { Message, MessageEmbed } from "discord.js";
import { config } from "../config";
import { getAskedBeforeText, getDefaultEmbed, removeHints } from "../utils";
import { API, APIResponse } from "./baseAPI";
import { cachePrefixes, redis } from "./cache";
import { twitch } from "./twitchID";

class IGDBAPI extends API {

    private getSearchQuery(title: string): string {
        return `search "${title.replace('"', "\\\"")}";
        fields name,cover.url, summary, game_engines.name, genres.name, platforms.name, first_release_date, rating, similar_games.name, websites.url;
        where cover != null & summary != null & name != null;
        limit 1;`
    }

    async search(msg: Message): Promise<APIResponse> {
        const parsedMessage = removeHints(msg.content);
        const game = parsedMessage
        .split(' ')
        .slice(1, msg.content.length)
        .join(' ')
        .trim()
        .toLowerCase();
        const cacheKey = await redis.get(`${cachePrefixes.gameSearch}${game}`);

        let cachedData = null;
        if (cacheKey) {
            cachedData = await redis.get(`${cachePrefixes.game}${cacheKey}`)
        }

        let gameData;
        if (!cachedData) {
            this.cacheMissIncrement();
            try {
                const token = await twitch.getToken();
                const { data } = await this.axiosInstance.post('/games', this.getSearchQuery(game), {
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                });
                if (data && data.length <= 0) {
                    redis.multi()
                        .set(`${cachePrefixes.game}`, JSON.stringify({ response: false }), 'ex', config.CACHE_NOT_FOUND_TTL)
                        .set(`${cachePrefixes.gameSearch}${game}`, '', 'ex', config.CACHE_NOT_FOUND_TTL)
                        .exec();
                    return ({ found: false });
                }
                gameData = data[0];
                gameData.response = true;

                redis.multi()
                    .set(`${cachePrefixes.game}${gameData.name}`, JSON.stringify(gameData))
                    .set(`${cachePrefixes.gameSearch}${game}`, gameData.name)
                    .exec();
            } catch (err) {
                console.error(err);
                throw err;
            }
        } else {
            this.cacheHitIncrement();
            gameData = JSON.parse(cachedData);
        }
        if (!gameData.response) {
            return ({ found: false });
        }

        const askedBeforeCount = await redis.incr(`${cachePrefixes.count}${gameData.name}`)

        return ({
            found: true,
            embed: this.validateMessageEmbed(this.getEmbed(gameData, askedBeforeCount))
        })
    }

    getEmbed(data: any, askedBeforeCount: number): MessageEmbed {

        const embed = getDefaultEmbed();
        embed.title = data.name ?? '';
        embed.description = data.summary ?? '';

        const steam = (data.websites ?? []).find((website: any) => website.url.indexOf('steampowered') > -1);
        if (steam) {
            embed.url = steam.url;
        }

        if (data.first_release_date) {
            embed.addField('Released', new Date(data.first_release_date * 1000).toLocaleDateString(), true);
        }

        if ((data.game_engines ?? []).length > 0) {
            embed.addField('Game Engine', data.game_engines[0].name, true)
        }
        if ((data.genres ?? []).length > 0) {
            embed.addField('Genres', data.genres.map((genre: any) => genre.name).join(', '), true)
        }
        if ((data.platforms ?? []).length > 0) {
            embed.addField('Platforms', data.platforms.map((platform: any) => platform.name).join(', '), false)
        }
        if ((data.similar_games ?? []).length > 0) {
            embed.addField('Similar Games', data.similar_games.slice(0, 7).map((game: any) => game.name).join(', '), true);
        }
        if (data.rating) {
            embed.addField('Rating', `${Number.parseFloat(data.rating).toFixed(1)}/100`, true);
        }
        embed.setFooter(getAskedBeforeText(askedBeforeCount));
        embed.setColor('#4de852');
        embed.setImage(`https:${data.cover.url.replace('t_thumb', 't_1080p')}`)

        return embed;
    }
}

export const igdb = new IGDBAPI({
    baseURL: config.IGDB.BASE_URL,
    timeout: config.API_TIMEOUT,
    name: 'igdb',
    defaultHeaders: {
        'Client-ID': config.Twitch.CLIENT_ID,
        Accept: 'application/json'
    }
});