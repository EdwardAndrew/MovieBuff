import { Message, MessageEmbed } from "discord.js";
import { search } from "./commands/search";
import { config } from "./config";
import { blankChar } from "./utils";

export const router = {
    route: (msg: Message) => {
        const command = msg.content.trim().split(' ').slice(1, msg.content.length).join(' ').toLowerCase();
        switch (command.replace(/['\?\ \.]/g, '')) {
            case 'h':
            case 'commands':
            case 'help':
                msg.channel.send(`${blankChar}I'd love to help you...`, getHelpEmbed());
                return;
            case 'i':
            case 'inf':
            case 'info':
                msg.channel.send(`${blankChar}Here's what I can tell you about myself.`, getInfoEmbed());
                return;
            case 'prefix':
            case 'whatsyourprefix':
                msg.channel.send(`${blankChar}\`${config.COMMAND_PREFIX}\` is my prefix.`);
                return;
            default:
                search(msg);
                return;
        }
    }
}

const getHelpEmbed = () => {
    const embed = new MessageEmbed({
        title: `${config.BOT_NAME} Help`,
        description: "Here's some of examples of how to use this bot!",
    });
    embed.setAuthor(config.BOT_NAME);
    embed.addField('Anime Search', '`!mb !anime Toradora!`', false);
    embed.addField('Game Search', '`!mb !game World of Warcraft`', false);
    embed.addField('Movie Search', '`!mb !movie Inception`', false);
    embed.addField('Prefix Hint', `<@${config.CLIENT_ID}>\` what\'s your prefix?\``, false);
    embed.addField('Bot Information & Support', '`!mb info`', false);
    return embed;
}

const getInfoEmbed = () => {
    const embed = new MessageEmbed({
        title: `${config.BOT_NAME} Info`,
        description: ''
    });
    embed.setAuthor(config.BOT_NAME)
    embed.addField('Developer', '<@235393504396836866>');
    embed.addField('Support Server', 'https://discord.gg/KvVUSA7');
    embed.addField('Bot Version', `\`${config.VERSION}\``);
    return embed;
}


