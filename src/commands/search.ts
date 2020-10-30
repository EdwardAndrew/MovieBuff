import { Message, MessageEmbed } from 'discord.js';

import { omdb } from '../apis/omdb';
import { jikan } from '../apis/jikan';
import { getHints, Hint } from '../utils';
import { API, APIResponse } from '../apis/baseAPI';

export const search = async (msg: Message) => {
    const foundHints = getHints(msg.content);

    // const api: API = foundHints.length > 0 ? getAPI(foundHints[0]) : omdb;
    const api : API = omdb;
    try {
        const result: APIResponse = await api.search(msg)

        if (!result.found) {
            msg.react('😭');
            msg.channel.send(`I've not heard of that before, sorry!`);
            return;
        };

        msg.channel.send(`Here's what I can tell you about *${result.embed.title}*`, result.embed);
    } catch (err) {
        msg.channel.send('Oops! We encountered a problem while searching. Please try later!');
        return;
    }

}

const getAPI = (hint: Hint): API => {
    switch (hint) {
        case Hint.anime:
            return jikan;
        default:
            return omdb;
    }
}
