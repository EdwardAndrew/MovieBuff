import { Message, MessageEmbed } from "discord.js";
import { API } from "./baseAPI";
import { config } from '../config';
import { removeHints, getAskedBeforeText, getDefaultEmbed } from "../utils";
import { redis, cachePrefixes } from './cache';

class OMDBApi extends API {
    async search(msg: Message) {
        const parsedMessage = removeHints(msg.content);
        const movie = parsedMessage.split(' ').slice(1, msg.content.length).join(' ').trim();
        const cacheKey = await redis.get(`${cachePrefixes.movieSearch}${movie}`);

        let cachedData = null;
        if (cacheKey) {
            cachedData = await redis.get(`${cachePrefixes.movie}${cacheKey}`);
        };

        let movieData;
        if (!cachedData) {
            try {
                this.cacheMissIncrement();

                const params = {
                    t: movie,
                    plot: 'full'
                }
                const { data } = await this.axiosInstance.get('/', {
                    params
                });
                movieData = data;
                if (movieData.Response.toLowerCase() == 'false') {
                    redis.multi()
                        .set(`${cachePrefixes.movie}`, JSON.stringify({ Response: 'false' }), 'ex', config.CACHE_NOT_FOUND_TTL)
                        .set(`${cachePrefixes.movieSearch}${movie}`, '', 'ex', config.CACHE_NOT_FOUND_TTL)
                        .exec()
                } else {
                    const key = movieData.Title.toLowerCase();
                    redis.multi()
                        .set(`${cachePrefixes.movie}${key}`, JSON.stringify(movieData))
                        .set(`${cachePrefixes.movieSearch}${movie}`, key)
                        .exec();
                }
            } catch (err) {
                console.error(err);
                throw err;
            }
        } else {
            movieData = JSON.parse(cachedData);
            this.cacheHitIncrement();
        }

        if (movieData.Response.toLowerCase() == 'false') {
            return ({ found: false });
        }

        const askedBeforeCount = await redis.incr(`${cachePrefixes.count}${movieData.Title.toLowerCase()}`);

        return ({
            embed: this.getEmbed(movieData, askedBeforeCount),
            found: true
        });
    }


    private getEmbed(data: any, askCount: number): MessageEmbed {
        const embed = getDefaultEmbed();

        embed.title = data.Title;
        embed.setDescription(data.Plot);
        embed.setColor('#f7924a');
        embed.addField('Genre', data.Genre, true);
        embed.setFooter(getAskedBeforeText(askCount));
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
        return this.validateMessageEmbed(embed);
    }
}

export const omdb = new OMDBApi({
    baseURL: config.OMDB.BASE_URL,
    name: 'omdb',
    defaultParams: {
        apikey: config.OMDB.API_KEY
    },
    timeout: config.API_TIMEOUT
});