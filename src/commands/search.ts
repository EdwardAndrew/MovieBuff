import { Message, MessageEmbed, MessageReaction } from 'discord.js';

import { omdb } from '../apis/omdb';
import { jikan } from '../apis/jikan';
import { blankChar, getHints, Hint } from '../utils';
import { API, APIResponse, DownstreamResponse } from '../apis/baseAPI';
import { igdb } from '../apis/igdb';
import { search_errored, search_found, search_notFound } from '../metrics';

export const search = async (msg: Message) => {
    const foundHints = getHints(msg.content);

    const api: API<DownstreamResponse> = foundHints.length > 0 ? getAPI(foundHints[0]) : omdb;
    try {
        const result: APIResponse = await api.search(msg)

        if (!result.found) {
            msg.channel.send(`${blankChar}I've not heard of that before, sorry!`);
            msg.react('😭');
            search_notFound.inc();
            return;
        };
        search_found.inc();
        const sentMessage: Message = await msg.channel.send(`${blankChar}Here's what I can tell you about *${result.embed.title}*`, result.embed);
        const prevPage = (data: MessageReaction) => {
            const editedMessageEmbed = new MessageEmbed();
            editedMessageEmbed.setDescription('Previous description');
            data.message.edit('This is an edited message', editedMessageEmbed);
        };
        const nextPage = (data: MessageReaction) => {
            const editedMessageEmbed = new MessageEmbed();
            editedMessageEmbed.setDescription('Next description');
            data.message.edit('This is an edited message', editedMessageEmbed);
        }
        await addPageReacts(sentMessage);
        sentMessage
            .createReactionCollector(reactionFilter('◀'), { dispose: true })
            .on('collect', prevPage)
            .on('remove', prevPage)

        sentMessage
            .createReactionCollector(reactionFilter('▶'), { dispose: true })
            .on('collect', nextPage)
            .on('remove', nextPage)

    } catch (err) {
        console.error(err);
        msg.channel.send(`${blankChar}Oops! We encountered a problem while searching. Please try later!`);
        search_errored.inc();
        return;
    }

}

const reactionFilter = (emoji: string) => (mr: MessageReaction) => mr.emoji.name == emoji;

const addPageReacts = async (message: Message) => {
    await message.react('◀')
    await message.react('▶')
}

const getAPI = (hint: Hint): API<DownstreamResponse> => {
    switch (hint) {
        case Hint.anime:
            return jikan;
        case Hint.game:
            return igdb;
        default:
            return omdb;
    }
}
