import dotenv from 'dotenv';
dotenv.config();
import Discord from 'discord.js';

import { config } from './config';
import { search } from './search';

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

    const command = msg.content.trim().split(' ').slice(1, msg.content.length).join(' ');
    if (command.length == 0) {
        msg.react('👀')
        msg.reply(`*Yes?* What would you like to ask me about? (Try '!mb Star Wars')`)
        return;
    }
    msg.react('🎬');

    if (command.toLowerCase() == 'help') {
        msg.channel.send("I'd love to help you.... Please ask Ed to finish this bit! 😅")
    }
    else {
        search(msg);
    }
});

client.login(config.DISCORD_TOKEN);

