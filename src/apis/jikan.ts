import { API, DownstreamResponse } from "./baseAPI";
import { config } from "../config";
import { MessageEmbed } from "discord.js";
import { getAskedBeforeText, getDefaultEmbed, removeHints } from "../utils";
import { cachePrefixes } from "./cache";

interface JikanResponse extends DownstreamResponse{
}

class JikanAPI extends API<JikanResponse> {
    async apiSearch(searchTerm: string): Promise<JikanResponse> {
        const params = {
            q: searchTerm
        }
        const { data } = await this.axiosInstance.get('search/anime', {
            params
        });

        if ((data?.results || []).length > 0) {
            return ({
                ...data.results[0],
                response: true,
                cacheKey: { 
                    searchTerm: data.results[0].title || searchTerm
                } 
            })
        };

        return ({
            response: false,
            cacheKey: {
                searchTerm
            }
        })
    }

    protected getEmbed(data: JikanResponse, askedBeforeCount: number): MessageEmbed {
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
        return embed;
    }
}

export const jikan = new JikanAPI({
    baseURL: config.Jikan.BASE_URL,
    name: 'jikan',
    timeout: config.API_TIMEOUT,
    cachePrefixes: {
        count: cachePrefixes.count,
        data: cachePrefixes.anime,
        search: cachePrefixes.animeSearch
    }
});