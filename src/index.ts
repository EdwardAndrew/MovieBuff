import dotenv from 'dotenv';
dotenv.config();
import Discord from 'discord.js';

import { config } from './config';
import { router } from './router';

const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
        activity: {
            name: "Type !mb help",
            type: "WATCHING",
        }
    })
});

client.on('message', msg => {
    if (msg.mentions.users.first() != client.user && !msg.content.startsWith('!mb') && !msg.content.startsWith('!moviebuff')) return;
    if (msg.member.id == client.user.id) return;

    router.route(msg);
});

client.login(config.DISCORD_TOKEN);

