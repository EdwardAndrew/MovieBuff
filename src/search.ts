import Redis from 'ioredis';
import axios from 'axios';
import { Message, MessageEmbed } from 'discord.js';

import { config } from './config';

const redis = new Redis();

const movieAPI = axios.create({
    baseURL: 'http://www.omdbapi.com/',
    timeout: 4000,
    params: {
        apikey: config.OMDB_API_KEY
    }
});

const moviePrefix = 'moviebuff/movie/';
const countPrefix = 'moviebuff/count/';

export const search = async (msg : Message) => {
    const movie = msg.content.trim().split(' ').slice(1, msg.content.length).join(' ');
    const cacheKey = movie.toLowerCase();
    const cachedData = await redis.get(`${moviePrefix}${cacheKey}`);

    let movieData;
    if (!cachedData) {
        try {

            const params = {
                t: movie,
                plot: 'full'
            }

            const { data } = await movieAPI.get('/', {
                params
            });
            movieData = data;
            if (movieData.Response == 'false') {
                redis.set(`${moviePrefix}${cacheKey}`, null, 'ex', 24 * 60 * 60);
            }
            else {
                redis.set(`${moviePrefix}${cacheKey}`, JSON.stringify(movieData));
            }
        } catch (err) {
            console.error(err);
            msg.channel.send('Oops! We encountered a problem while searching. Please try later!');
            return;
        }
    } else {
        movieData = JSON.parse(cachedData);
    }
    if (movieData.Response.toLowerCase() == 'false') {
        msg.react('😭');
        msg.channel.send(`I've not heard of that before, sorry!`);
        return;
    }

    const askedBeforeCount = await redis.incr(`${countPrefix}${movieData.Title}`);
    const embed = getEmbed(movieData, askedBeforeCount)


    if (embed.description == 'N/A') {
        embed.description = "There's no description available."
    } else {
        embed.description = movieData.Plot;
    }
    
    msg.channel.send(`Here's what I can tell you about *${movieData.Title}.*`, embed)
}

const getAskedBeforeText = (count: number) => {
    switch (count - 1) {
        case 0:
            return "I've not been asked about this one before.";
        case 1:
            return "Somebody asked me about this before...";
        case 2:
            return "I've been asked about this twice...";
        default:
            return `I've been asked about this ${count - 1} times...`
    }
}

const getEmbed = (data: any, askCount: number) => {
    const embed = new MessageEmbed({
        description: data.Description == 'N/A' ? "There's no description available." : data.Description,
    });
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
            if(data.Released == 'N/A'){
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
