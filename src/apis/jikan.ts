import { API, APIResponse } from "./baseAPI";
import { config } from "../config";
import { Message, MessageEmbed } from "discord.js";
import { getAskedBeforeText, getDefaultEmbed, removeHints } from "../utils";
import { redis, cachePrefixes } from "./cache";

class JikanAPI extends API {
    async search(msg: Message): Promise<APIResponse> {

        const parsedMessage = removeHints(msg.content);
        const search = parsedMessage.split(' ').slice(1, msg.content.length).join(' ').trim();
        const cacheKey = search.toLowerCase();
        const cachedData = await redis.get(`${cachePrefixes.anime}${cacheKey}`);

        let animeData;
        if (!cachedData) {
            try {
                this.cacheMissIncrement();
                const params = {
                    q: search
                }
                const { data } = await this.axiosInstance.get('search/anime', {
                    params
                });
                if (data?.results.length || 0 > 0) {
                    animeData = data.results[0];
                    animeData.response = true;
                    redis.set(`${cachePrefixes.anime}${cacheKey}`, JSON.stringify(animeData));
                } else {
                    redis.set(`${cachePrefixes.anime}${cacheKey}`, JSON.stringify({response: false}), 'ex', config.CACHE_NOT_FOUND_TTL);
                }
            } catch (err) {
                console.error(err);
                throw err;
            }
        } else {
            this.cacheHitIncrement();
            animeData = JSON.parse(cachedData);
        }

        if(!animeData.response){
            return ({ found: false })
        }

        const askedBeforeCount = await redis.incr(`${cachePrefixes.count}${cacheKey}`);

        return {
            found: true,
            embed: this.getEmbed(animeData, askedBeforeCount)
        }
    }

    private getEmbed(data: any, askedBeforeCount: number): MessageEmbed {
        const embed = getDefaultEmbed();
        embed.title = data.title;
        embed.description = data.synopsis;
        embed.url = data.url

        embed.addField('Episodes', data.episodes, true);
        embed.addField('Score', data.score, true);
        embed.addField('Rated', data.rated, true);
        embed.setColor('#5fc1f5');
        embed.setFooter(getAskedBeforeText(askedBeforeCount));
        embed.setImage(data.image_url);
        return this.validateMessageEmbed(embed);
    }
}

export const jikan = new JikanAPI({
    baseURL: config.Jikan.BASE_URL,
    name: 'jikan',
    timeout: config.API_TIMEOUT
});