import {
  AddEventHandlerFunction,
  DiscordEvent,
  ExtractInfoForEventFunction,
  HandlerFunctionFor,
  MessageRelatedOptions,
} from "../types/base";
import { GuildChannel, Message, TextBasedChannels } from "discord.js";
import { addToTree, getIdFromParentName } from "../helper";

export interface MessageEventHandlerOptions extends MessageRelatedOptions {
  event: DiscordEvent.MESSAGE;
  description: string;
  trigger?: string;
  subTrigger?: string;
}

export type MessageHandlerFunction<T extends DiscordEvent> = HandlerFunctionFor<
  T,
  DiscordEvent.MESSAGE,
  Message
>;

export const addMessageHandler: AddEventHandlerFunction<MessageEventHandlerOptions> =
  (options, ioc, tree) => {
    const channels = options.channelNames ?? [];
    const parents = options.parentNames ?? [];
    if (channels.length === 0 && parents.length === 0) channels.push("");

    const trigger = options.trigger ?? "";
    const subTrigger = options.subTrigger ?? "";

    const combinedChannels = [
      ...channels,
      ...parents.map((c) => getIdFromParentName(c)),
    ];

    for (const channel of combinedChannels) {
      addToTree([channel, trigger, subTrigger], { options, ioc }, tree);
    }
  };

export const extractMessageInfo: ExtractInfoForEventFunction<DiscordEvent.MESSAGE> =
  (message) => {
    const getChannelIdentifier = (channel: TextBasedChannels) =>
      channel.type === "DM" ? channel.id : channel.name;

    const channel = message.channel;
    const channelIdentifier = getChannelIdentifier(channel);

    const split = message.content.split(" ");
    const trigger = split[0];
    const subTrigger = split[1];

    const baseInfo = {
      member: message.member,
      isDirectMessage: message.channel.type === "DM",
    };

    const info = [
      {
        ...baseInfo,
        handlerKeys: [channelIdentifier, trigger, subTrigger],
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
        handlerKeys: [parentIdentifier, trigger, subTrigger],
      });
    }

    return info;
  };
