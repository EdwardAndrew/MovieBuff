import { Message } from "discord.js";
import { search } from "./commands/search";

export const router = {
    route: (msg: Message) => {
        const command = msg.content.trim().split(' ').slice(1, msg.content.length).join(' ').toLowerCase();
        if (command.length == 0) {
            msg.react('👀')
            msg.reply(`*Yes?* What would you like to ask me about? (Try '!mb Star Wars')`)
            return;
        }

        if (command == 'help') {
            msg.channel.send("I'd love to help you.... Please ask Ed to finish this bit! 😅")
            return;
        }

        search(msg);
    }
}

