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

const moviePrefix = 'moviebuff/movie/';
const countPrefix = 'moviebuff/count/';

const movieAPI = axios.create({
    baseURL: 'http://www.omdbapi.com/',
    timeout: '2000',
    params: {
        apikey: config.OMDB_API_KEY
    }
})

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        activity: {
            name: "@MovieBuff help",
            type: "WATCHING",
        }
    })
});

client.on('message', async msg => {
    if (msg.mentions.users.first() != client.user && !msg.content.startsWith('!moviebuff')) return;
    if (msg.member.id == client.user) return;
    if(msg.guild.id == '771121281495597117') {
        msg.reply('ok');
        return;
    }

    const command = msg.content.trim().split(' ').slice(1, msg.content.length).join(' ');
    if (command.length == 0) {
        msg.react('👀')
        msg.reply(`*Yes?* What would you like to ask me about? (Try '<@${client.user.id}> Star Wars')`)
        return;
    }
    msg.react('🎬');

    if (command.toLowerCase() == 'help') {
        msg.channel.send("I'd love to help you.... Please ask Ed to finish this bit! 😅")
    }
    else {
        await search(msg);
    }
});

const search = async msg => {
    const movie = msg.content.trim().split(' ').slice(1, msg.content.length).join(' ');
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
    const embed = new Discord.MessageEmbed();

    if (movieData.Poster != 'N/A') embed.setImage(movieData.Poster);
    embed.title = movieData.Title;
    embed.url = `https://www.imdb.com/title/${movieData.imdbID}/`;
    if(embed.description == 'N/A') {
        embed.description = "There's no description available."
    } else {
        embed.description = movieData.Plot;
    }
    embed.addField('Director', movieData.Director, true);
    embed.addField('Released', movieData.Released, true);
    embed.addField('Genre', movieData.Genre, true);
    embed.addField('Actors', movieData.Actors, true);
    embed.addField('Runtime', movieData.Runtime, true);
    embed.setFooter(getAskedBeforeText(askedBeforeCount));
    embed.setAuthor('MovieBuff', '', 'https://discord.gg/KvVUSA7');

    msg.channel.send(`Here's what I can tell you about *${movieData.Title}.*`, embed)
}

const getAskedBeforeText = count => {
    switch (count - 1) {
        case 0:
            return "I've not been asked about this one for a long time.";
        case 1:
            return "Somebody asked me about this recently...";
        case 2: 
            return "I've been asked about this twice recently...";
        default:
            return `I've been asked about this ${count - 1} times recently...`
    }
}


client.login(config.DISCORD_TOKEN);

