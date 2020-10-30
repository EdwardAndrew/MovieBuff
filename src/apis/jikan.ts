import { API, APIResponse } from "./baseAPI";
import { config } from "../config";
import { Message, MessageEmbed } from "discord.js";
import { getAskedBeforeText, removeHints } from "../utils";
import { redis, prefixes } from "./cache";

class JikanAPI extends API {
    async search(msg: Message): Promise<APIResponse> {

        const parsedMessage = removeHints(msg.content);
        const search = parsedMessage.split(' ').slice(1, msg.content.length).join(' ').trim();
        const cacheKey = search.toLowerCase();
        const cachedData = await redis.get(`${prefixes.anime}${cacheKey}`);

        let animeData;
        if (!cachedData) {
            try {
                const params = {
                    q: search
                }
                const { data } = await this.axiosInstance.get('search/anime', {
                    params
                });
                if (data?.results.length || 0 > 0) {
                    redis.set(`${prefixes.anime}${cacheKey}`, JSON.stringify(data.results[0]));
                    animeData = data.results[0];
                } else {
                    return {
                        found: false
                    }
                }
            } catch (err) {
                console.error(err);
                throw err;
            }
        } else {
            animeData = JSON.parse(cachedData);
        }

        const askedBeforeCount = await redis.incr(`${prefixes.count}${cacheKey}`);

        return {
            found: true,
            embed: this.getEmbed(animeData, askedBeforeCount)
        }
    }

    private getEmbed(data: any, askedBeforeCount: number): MessageEmbed {
        const embed = new MessageEmbed({
            title: data.title,
            description: data.synopsis,
            url: data.url,
        });
        embed.addField('Episodes', data.episodes, true);
        embed.addField('Score', data.score, true);
        embed.addField('Rated', data.rated, true);

        embed.setFooter(getAskedBeforeText(askedBeforeCount))
        embed.setImage(data.image_url);
        return embed;
    }
}

export const jikan = new JikanAPI({
    baseURL: config.Jikan.BASE_URL,
    timeout: config.API_TIMEOUT
});