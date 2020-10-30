import { Message, MessageEmbed } from "discord.js";
import { API, APIResponse } from "./baseAPI";
import { config } from '../config';
import { removeHints, getAskedBeforeText } from "../utils";
import { redis, prefixes } from './cache';

class OMDBApi extends API {
    async search(msg: Message) {
        const parsedMessage = removeHints(msg.content);
        const movie = parsedMessage.split(' ').slice(1, msg.content.length).join(' ').trim();
        const cacheKey = movie.toLowerCase();
        const cachedData = await redis.get(`${prefixes.movie}${cacheKey}`);

        const result: APIResponse = {
            found: false
        }

        let movieData;
        if (!cachedData) {
            try {

                const params = {
                    t: movie,
                    plot: 'full'
                }

                const { data } = await this.axiosInstance.get('/', {
                    params
                });
                movieData = data;
                if (movieData.Response.toLowerCase() == 'false') {
                    redis.set(`${prefixes.movie}${cacheKey}`, null, 'ex', 24 * 60 * 60);
                }
                else {
                    redis.set(`${prefixes.movie}${cacheKey}`, JSON.stringify(movieData));
                }
            } catch (err) {
                console.error(err);
                throw err;
            }
        } else {
            movieData = JSON.parse(cachedData);
        }

        const askedBeforeCount = await redis.incr(`${prefixes.count}${movieData.Title}`);
        result.embed = this.getEmbed(movieData, askedBeforeCount);
        result.found = true;

        return result;
    }


    private getEmbed(data: any, askCount: number): MessageEmbed {
        const embed = new MessageEmbed();
        if (data.Plot.length > config.MAX_DESCRIPTION_LENGTH) {
            const text = data.Plot.slice(0, config.MAX_DESCRIPTION_LENGTH - 3).trim().concat('...');
            embed.setDescription(text);
        } else if (data.Plot == 'N/A') {
            embed.setDescription("No description is available.")
        } else {
            embed.setDescription(data.Plot);
        }

        embed.setColor('#f7924a');

        embed.addField('Genre', data.Genre, true);
        embed.setFooter(getAskedBeforeText(askCount));
        embed.setAuthor('MovieBuff', '', 'https://discord.gg/KvVUSA7');
        if (data.Poster != 'N/A') embed.setImage(data.Poster);
        embed.title = data.Title;
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
        return embed;
    }
}

export const omdb = new OMDBApi({
    baseURL: config.OMDB.BASE_URL,
    defaultParams: {
        apikey: config.OMDB.API_KEY
    },
    timeout: config.API_TIMEOUT
});