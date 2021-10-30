import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
  MessageRelatedOptions,
} from "../types/base";
import {
  GuildChannel,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  TextBasedChannels,
  User,
} from "discord.js";
import { addToTree, getIdFromParentName } from "../helper";

export interface ReactionEventHandlerOptions extends MessageRelatedOptions {
  emoji: string;
  event: DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE;
}

export type ReactionHandlerFunction<T extends DiscordEvent> =
  HandlerFunctionFor<
    T,
    DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE,
    [MessageReaction | PartialMessageReaction, User | PartialUser]
  >;

export const addReactionHandler: AddEventHandlerFunction<ReactionEventHandlerOptions> =
  (options, ioc, tree) => {
    const channels = options.channelNames ?? [];
    const parents = options.parentNames ?? [];
    if (channels.length === 0 && parents.length === 0) channels.push("");

    const emoji = options.emoji ?? "";

    const combinedChannels = [
      ...channels,
      ...parents.map((c) => getIdFromParentName(c)),
    ];

    for (const channel of combinedChannels) {
      addToTree([channel, emoji], { options, ioc }, tree);
    }
  };

export const extractReactionInfo: ExtractInfoForEventFunction<
  DiscordEvent.REACTION_ADD | DiscordEvent.REACTION_REMOVE
> = (reaction, user) => {
  const getChannelIdentifier = (channel: TextBasedChannels) =>
    channel.type === "DM" ? channel.id : channel.name;

  const message = reaction.message;
  const channel = message.channel;
  const guild = channel.type === "DM" ? null : channel.guild;
  const member = guild?.members.resolve(user.id) ?? null;

  const channelIdentifier = getChannelIdentifier(channel);

  const baseInfo = {
    member,
    isDirectMessage: channel.type === "DM",
    content: message.content,
  };

  const info = [
    {
      ...baseInfo,
      handlerKeys: [channelIdentifier, reaction.emoji.name],
    },
  ];

  const maybeParent = (channel as GuildChannel).parent;
  if (maybeParent) {
    const normalizedParentName = maybeParent.name
      .match(/[a-z-\d\s.]+/gi)[0]
      .trim();
    const parentIdentifier = getIdFromParentName(normalizedParentName);

    info.push({
      ...baseInfo,
      handlerKeys: [parentIdentifier, reaction.emoji.name],
    });
  }

  return info;
};
