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
                msg.channel.send(`${blankChar}I'd love to help you...`, HelpEmbed);
                return;
            case 'i':
            case 'inf':
            case 'info':
                msg.channel.send(`${blankChar}Here's what I can tell you about myself.`, InfoEmbed);
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

const HelpEmbed = new MessageEmbed({
    title: `${config.BOT_NAME} Help`,
    description: "Here's some of examples of how to use this bot!",
});
HelpEmbed.setAuthor(config.BOT_NAME);
HelpEmbed.addField('Anime Search', '`!mb !anime Toradora!`', false);
HelpEmbed.addField('Game Search', '`!mb !game World of Warcraft`', false);
HelpEmbed.addField('Movie Search', '`!mb !movie Inception`', false);
HelpEmbed.addField('Prefix Hint', '`<@> what\'s your prefix?`', false);
HelpEmbed.addField('Bot Information & Support', '`!mb info`', false);

const InfoEmbed = new MessageEmbed({
    title: `${config.BOT_NAME} Info`,
    description: ''
});
InfoEmbed.setAuthor(config.BOT_NAME)
InfoEmbed.addField('Developer', '<@235393504396836866>');
InfoEmbed.addField('Support Server', 'https://discord.gg/KvVUSA7');
InfoEmbed.addField('Bot Version', `\`${config.VERSION}\``);

