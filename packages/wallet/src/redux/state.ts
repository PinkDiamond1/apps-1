import { OutboxState, EMPTY_OUTBOX_STATE, SideEffects } from './outbox/state';
import {
  ChannelState,
  ChannelStatus,
  setChannel as setChannelInStore,
  WaitForChannel,
} from './channel-state/state';
import { Properties } from './utils';
import * as indirectFunding from './indirect-funding/state';
import { DirectFundingStore } from './direct-funding-store/state';
import { accumulateSideEffects } from './outbox';

export type WalletState = WaitForLogin | WaitForAdjudicator | MetaMaskError | Initialized;

// -----------
// State types
// -----------
export const WAIT_FOR_LOGIN = 'INITIALIZING.WAIT_FOR_LOGIN';
export const METAMASK_ERROR = 'INITIALIZING.METAMASK_ERROR';
export const WAIT_FOR_ADJUDICATOR = 'INITIALIZING.WAIT_FOR_ADJUDICATOR';
export const WALLET_INITIALIZED = 'WALLET.INITIALIZED';

// ------
// States
// ------

interface Shared {
  channelState: ChannelState;
  outboxState: OutboxState;
  directFundingStore: DirectFundingStore;
}

export interface WaitForLogin extends Shared {
  type: typeof WAIT_FOR_LOGIN;
}

export interface MetaMaskError extends Shared {
  type: typeof METAMASK_ERROR;
}

export interface WaitForAdjudicator extends Shared {
  type: typeof WAIT_FOR_ADJUDICATOR;
  uid: string;
}

export interface Initialized extends Shared {
  type: typeof WALLET_INITIALIZED;
  uid: string;
  networkId: number;
  adjudicator: string;
  consensusLibrary: string;

  // procedure branches are optional, and exist precisely when that procedure is running
  indirectFunding?: indirectFunding.IndirectFundingState;
}

export interface IndirectFundingOngoing extends Initialized {
  indirectFunding: indirectFunding.IndirectFundingState;
}
export function indirectFundingOngoing(state: Initialized): state is IndirectFundingOngoing {
  return state.indirectFunding ? true : false;
}

// ------------
// Constructors
// ------------
export const emptyState: Shared = {
  outboxState: EMPTY_OUTBOX_STATE,
  channelState: { initializedChannels: {}, initializingChannels: {} },
  directFundingStore: {},
};

function shared(params: Shared): Shared {
  const { outboxState, channelState, directFundingStore } = params;
  return { outboxState, channelState, directFundingStore };
}

export function waitForLogin(): WaitForLogin {
  return { type: WAIT_FOR_LOGIN, ...emptyState };
}

export function metaMaskError(params: Properties<MetaMaskError>): MetaMaskError {
  return { ...shared(params), type: METAMASK_ERROR };
}

export function waitForAdjudicator(params: Properties<WaitForAdjudicator>): WaitForAdjudicator {
  const { uid } = params;
  return { ...shared(params), type: WAIT_FOR_ADJUDICATOR, uid };
}

export function initialized(params: Properties<Initialized>): Initialized {
  const { uid, networkId, adjudicator, consensusLibrary } = params;
  return {
    ...shared(params),
    type: WALLET_INITIALIZED,
    uid,
    networkId,
    adjudicator,
    consensusLibrary,
  };
}

// -------------------
// Getters and setters
// -------------------

export function getChannelStatus(state: WalletState, channelId: string): ChannelStatus {
  return state.channelState.initializedChannels[channelId];
}

export function setSideEffects(state: Initialized, sideEffects: SideEffects): Initialized {
  return { ...state, outboxState: accumulateSideEffects(state.outboxState, sideEffects) };
}

// WaitForChannel is the only ChannelStatus without a channelId.
// We don't need it anymore, as it's covered by InitializingChannelStatus.
// This is a temporary fix to the signature while we work to remove it.
type ChannelStatusV2 = Exclude<ChannelStatus, WaitForChannel>;

export function setChannel(state: Initialized, channel: ChannelStatusV2): Initialized {
  return { ...state, channelState: setChannelInStore(state.channelState, channel) };
}

export { indirectFunding };
