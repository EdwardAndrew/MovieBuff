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
    timeout: '4000',
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
    if (msg.guild.id == '771121281495597117') {
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
                    plot: 'full'
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

    console.log('DATA', movieData);

    const askedBeforeCount = await redis.incr(`${countPrefix}${movieData.Title}`);
    const embed = getEmbed(movieData, askedBeforeCount)


    if (embed.description == 'N/A') {
        embed.description = "There's no description available."
    } else {
        embed.description = movieData.Plot;
    }


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

const getEmbed = (data, askCount) => {
    const embed = new Discord.MessageEmbed({
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


client.login(config.DISCORD_TOKEN);

