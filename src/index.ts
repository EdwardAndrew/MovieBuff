import dotenv from 'dotenv';
dotenv.config();
import Discord from 'discord.js';
import './metrics';

import { config } from './config';
import { router } from './router';
import { serverGauge } from './metrics';

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        activity: {
            name: "Type !mb help",
            type: "WATCHING",
        }
    });
    serverGauge.set(client.guilds.cache.size);
});

client.on('message', msg => {
    if (msg.mentions.users.first() != client.user && !msg.content.startsWith('!mb') && !msg.content.startsWith('!moviebuff')) return;
    if (msg.member.id == client.user.id) return;

    router.route(msg);
});

client.on('guildCreate', () => {
    serverGauge.set(client.guilds.cache.size);
});

client.on('guildDelete', () => {
    serverGauge.set(client.guilds.cache.size);
});

client.on('error', error => {
    console.error(error);
});

client.on('warn', warning => {
    console.warn(warning);
})

client.login(config.DISCORD_TOKEN);
