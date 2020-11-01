import {  MessageEmbed } from "discord.js";
import { config } from "../config";
import { getAskedBeforeText, getDefaultEmbed, removeHints } from "../utils";
import { API, DownstreamResponse } from "./baseAPI";
import { cachePrefixes } from "./cache";
import { twitch } from "./twitchID";

interface IGDBResponse extends DownstreamResponse {
}

class IGDBAPI extends API<IGDBResponse> {
    private getSearchQuery(title: string): string {
        return `search "${title.replace('"', "\\\"")}";
        fields name,cover.url, summary, game_engines.name, genres.name, platforms.name, first_release_date, rating, similar_games.name, websites.url;
        where cover != null & summary != null & name != null;
        limit 1;`
    }

    async apiSearch(searchTerm: string): Promise<IGDBResponse> {
        const token = await twitch.getToken();
        const { data } = await this.axiosInstance.post('/games', this.getSearchQuery(searchTerm), {
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        if (data && data.length <= 0) {
            return ({
                response: false,
                cacheKey: searchTerm
            });
        }

        return ({
            ...data[0],
            response: true,
            cacheKey: data[0].name || searchTerm
        });
    }

    protected getEmbed(data: IGDBResponse, askedBeforeCount: number): MessageEmbed {

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
    },
    cachePrefixes: {
        count: cachePrefixes.count,
        data: cachePrefixes.game,
        search: cachePrefixes.gameSearch
    }
});