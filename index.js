require('dotenv').config();
const Discord = require('discord.js');
const axios = require('axios').default;
const Redis = require("ioredis");
const client = new Discord.Client();
const redis = new Redis();

const config = {
    OMDB_API_KEY: process.env['OMDB_API_KEY'],
    DISCORD_TOKEN: process.env['DISCORD_TOKEN']
}

const moviePrefix = 'movie/';

const movieAPI = axios.create({
    baseURL: 'http://www.omdbapi.com/',
    timeout: '2000',
    params: {
        apikey: config.OMDB_API_KEY
    }
})

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    if (msg.mentions.users.first() != client.user) return;
    msg.react('🎬');
    await search(msg);
});

const search = async msg => {
    const movie = msg.content.split(' ').slice(1, msg.content.length).join(' ')
    const cacheKey = movie.toLowerCase();
    const cachedData = await redis.get(`${moviePrefix}${cacheKey}`);

    let movieData;
    if (!cachedData) {
        try {
            const { data } = await movieAPI.get('/', {
                params: {
                    t: movie,
                    plot: 'short'
                }
            });
            if (data.Response == 'false') {
                console.log(data);
                msg.channel.send(`I've not heard of that before, sorry!`);
                redis.set(`${moviePrefix}${cacheKey}`, null, 'ex', 24 * 60 * 60);
                return;
            }
            movieData = data;
            redis.set(`${moviePrefix}${cacheKey}`, JSON.stringify(movieData));
        } catch (err) {
            console.error(err);
            msg.channel.send('Oops! We encountered a problem while searching. Please try later!');
            return;
        }
    } else {
        movieData = JSON.parse(cachedData);
    }

    const embed = new Discord.MessageEmbed();

    if (movieData.Poster != 'N/A') embed.setImage(movieData.Poster);
    embed.title = movieData.Title;
    embed.url = `https://www.imdb.com/title/${movieData.imdbID}/`;
    embed.description = movieData.Plot;
    embed.addField('Director', movieData.Director, true);
    embed.addField('Released', movieData.Released, true);
    embed.addField('Genre', movieData.Genre, true);
    embed.addField('Actors', movieData.Actors, true);
    embed.addField('Runtime', movieData.Runtime, true);
    embed.setFooter('');
    embed.setAuthor('MovieBuff');

    msg.channel.send(`Here's what I can tell you about *${movieData.Title}*.`, embed)
}


client.login(config.DISCORD_TOKEN);

