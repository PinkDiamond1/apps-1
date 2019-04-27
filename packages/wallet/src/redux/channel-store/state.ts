import { ChannelState } from './channel-state';

export interface InitializingChannelState {
  address: string;
  privateKey: string;
}

export interface InitializingChannels {
  [participantAddress: string]: InitializingChannelState;
}

export interface InitializedChannels {
  [channelId: string]: ChannelState;
}
export interface ChannelStore {
  initializingChannels: InitializingChannels;
  initializedChannels: InitializedChannels;
}

export function emptyChannelStore(): ChannelStore {
  return { initializedChannels: {}, initializingChannels: {} };
}

// -------------------
// Getters and setters
// -------------------

export function setInitializingChannel(
  store: ChannelStore,
  channel: InitializingChannelState,
): ChannelStore {
  const initializingChannels = { ...store.initializingChannels, [channel.address]: channel };
  return { ...store, initializingChannels };
}

export function setChannel(store: ChannelStore, channel: ChannelState): ChannelStore {
  const channelId = channel.channelId;
  const initializedChannels = { ...store.initializedChannels, [channelId]: channel };
  return { ...store, initializedChannels };
}

export function getChannel(store: ChannelStore, channelId: string): ChannelState | undefined {
  return store.initializedChannels[channelId];
}
