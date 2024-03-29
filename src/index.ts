import dotenv from 'dotenv';
dotenv.config();
import Discord from 'discord.js';
import './metrics';

import { config } from './config';
import { router } from './router';
import { serverGauge } from './metrics';

const client = new Discord.Client();
const botCommandRegEx = new RegExp(`^${config.COMMAND_PREFIX} .*$`)

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        activity: {
            name: `Type ${config.COMMAND_PREFIX} help`,
            type: "WATCHING",
        }
    });
    config.CLIENT_ID = client.user.id;
    serverGauge.set(client.guilds.cache.size);
});

client.on('message', msg => {
    if(msg.mentions.users.first() != client.user && !botCommandRegEx.test(msg.content)){
        return;
    } 
    if(msg.member.id == client.user.id) return;
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
