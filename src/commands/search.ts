import { Message, MessageEmbed } from 'discord.js';

import { omdb } from '../apis/omdb';
import { jikan } from '../apis/jikan';
import { getHints, Hint } from '../utils';
import { API, APIResponse } from '../apis/baseAPI';
import { igdb } from '../apis/igdb';

export const search = async (msg: Message) => {
    const foundHints = getHints(msg.content);

    const api: API = foundHints.length > 0 ? getAPI(foundHints[0]) : omdb;
    try {
        const result: APIResponse = await api.search(msg)

        if (!result.found) {
            msg.react('😭');
            msg.channel.send(`I've not heard of that before, sorry!`);
            return;
        };

        msg.channel.send(`Here's what I can tell you about *${result.embed.title}*`, result.embed);
    } catch (err) {
        console.error(err);
        msg.channel.send('Oops! We encountered a problem while searching. Please try later!');
        return;
    }

}

const getAPI = (hint: Hint): API => {
    switch (hint) {
        case Hint.anime:
            return jikan;
        case Hint.game:
            return igdb;
        default:
            return omdb;
    }
}
