import { MessageEmbed } from "discord.js";
import { API, DownstreamResponse } from "./baseAPI";
import { config } from '../config';
import { getAskedBeforeText, getDefaultEmbed } from "../utils";
import { cachePrefixes } from './cache';

class OMDBApi extends API {
    async apiSearch(searchTerm: string): Promise<DownstreamResponse> {
        const params = {
            t: searchTerm,
            plot: 'full'
        }
        const { data } = await this.axiosInstance.get('/', {
            params
        });
        if (data.Response.toLowerCase() == 'false') {
            return ({
                response: false,
                cacheKey: searchTerm
            })
        };
        return ({
            ...data,
            response: true,
            cacheKey: data.Title.toLowerCase() || searchTerm
        })
    }

    protected getEmbed(data: any, askedBeforeCount: number): MessageEmbed {
        const embed = getDefaultEmbed();

        embed.title = data.Title;
        embed.setDescription(data.Plot);
        embed.setColor('#f7924a');
        embed.addField('Genre', data.Genre, true);
        embed.setFooter(getAskedBeforeText(askedBeforeCount));
        if (data.Poster != 'N/A') embed.setImage(data.Poster);
        embed.url = `https://www.imdb.com/title/${data.imdbID}/`;
        embed.addField('Actors', data.Actors, true);

        switch (data.Type) {
            case 'series':
                embed.addField('Seasons', data.totalSeasons, true);
                embed.addField('Writer', data.Writer, true);
                embed.addField('Year', data.Year, true);
                embed.addField('Language', data.Language, true);
                break;
            default:
                embed.addField('Runtime', data.Runtime, true);
                embed.addField('Director', data.Director, true);
                if (data.Released == 'N/A') {
                    embed.addField('Year', data.Year, true);
                } else {
                    embed.addField('Released', data.Released, true);
                }
                embed.addField('Language', data.Language, true);
                break;
        }
        if (data.Awards != 'N/A') {
            embed.addField('Awards', data.Awards, false)
        }
        // embed.provider = {
        //     name: 'test1234',
        //     url: 'http://localhost'
        // },
        // embed.type = 'rich';
        // embed.timestamp = Date.now();
        // embed.setThumbnail(data.Poster);
        return embed;
    }
}

export const omdb = new OMDBApi({
    baseURL: config.OMDB.BASE_URL,
    name: 'omdb',
    defaultParams: {
        apikey: config.OMDB.API_KEY
    },
    cachePrefixes: {
        count: cachePrefixes.count,
        data: cachePrefixes.movie,
        search: cachePrefixes.movieSearch
    },
    timeout: config.API_TIMEOUT
});