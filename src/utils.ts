import { MessageEmbed } from "discord.js";
import { config } from "./config";

export const blankChar = '\u200B';

export enum Hint {
    anime,
    movie,
    tv,
    game
}

interface HintMap {
    [key: string]: Hint
}

const hintMap: HintMap = {
    anime: Hint.anime,
    manga: Hint.anime,
    movie: Hint.movie,
    film: Hint.movie,
    tv: Hint.tv,
    show: Hint.tv,
    television: Hint.tv,
    game: Hint.game,
    vg: Hint.game,
    videogame: Hint.game
}

const getHintsInString = (command: string): string[] => command
      .split(' ')
      .filter((word: string) => {
        if (!word.startsWith('-') || word.length <= 1) return false;
        return Object.keys(hintMap).includes(word.slice(1, word.length));
      })

export const removeHints = (command: string): string => {
    const foundHints = getHintsInString(command);

    let result = command;
    for (let hint of foundHints) {
        result = result.replace(hint, '');
    }
    return result.trim();
}

export const getHints = (command: string): Hint[] => {
    const givenHints = getHintsInString(command);
    return givenHints.map((hint: string) => hintMap[hint.slice(1, hint.length)]);
}

export const getAskedBeforeText = (count: number) => {
    switch (count - 1) {
        case 0:
            return "I've not been asked about this one before.";
        case 1:
            return "Somebody asked me about this before...";
        default:
            return `I've been asked about this ${count} times...`
    }
}

export const getDefaultEmbed = (): MessageEmbed => {
    const embed = new MessageEmbed();
    return embed;
}