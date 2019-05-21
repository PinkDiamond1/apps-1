import { DirectFundingState } from '../../direct-funding/states';
import { IndirectFundingState } from '../states';
import { Constructor } from '../../../utils';

// -------
// States
// -------

export interface AWaitForPreFundSetup1 {
  type: 'IndirectFunding.AWaitForPreFundSetup1';
  channelId: string;
  ledgerId: string;
  processId: string;
}

export interface AWaitForDirectFunding {
  type: 'IndirectFunding.AWaitForDirectFunding';
  channelId: string;
  ledgerId: string;
  processId: string;
  directFundingState: DirectFundingState;
}
export interface AWaitForPostFundSetup1 {
  type: 'IndirectFunding.AWaitForPostFundSetup1';
  channelId: string;
  ledgerId: string;
  processId: string;
}
export interface AWaitForLedgerUpdate1 {
  type: 'IndirectFunding.AWaitForLedgerUpdate1';
  channelId: string;
  ledgerId: string;
  processId: string;
}

// ------------
// Constructors
// ------------

export const aWaitForPreFundSetup1: Constructor<AWaitForPreFundSetup1> = p => {
  const { channelId, ledgerId, processId } = p;
  return { type: 'IndirectFunding.AWaitForPreFundSetup1', channelId, ledgerId, processId };
};

export const aWaitForDirectFunding: Constructor<AWaitForDirectFunding> = p => {
  const { channelId, ledgerId, directFundingState, processId } = p;
  return {
    type: 'IndirectFunding.AWaitForDirectFunding',
    channelId,
    ledgerId,
    directFundingState,
    processId,
  };
};

export const aWaitForPostFundSetup1: Constructor<AWaitForPostFundSetup1> = p => {
  const { channelId, ledgerId, processId } = p;
  return { type: 'IndirectFunding.AWaitForPostFundSetup1', channelId, ledgerId, processId };
};

export const aWaitForLedgerUpdate1: Constructor<AWaitForLedgerUpdate1> = p => {
  const { channelId, ledgerId, processId } = p;
  return { type: 'IndirectFunding.AWaitForLedgerUpdate1', channelId, ledgerId, processId };
};

// -------
// Unions and Guards
// -------

export type PlayerAState =
  | AWaitForPreFundSetup1
  | AWaitForDirectFunding
  | AWaitForPostFundSetup1
  | AWaitForLedgerUpdate1;

export function isPlayerAState(state: IndirectFundingState): state is PlayerAState {
  return (
    state.type === 'IndirectFunding.AWaitForPreFundSetup1' ||
    state.type === 'IndirectFunding.AWaitForDirectFunding' ||
    state.type === 'IndirectFunding.AWaitForPostFundSetup1' ||
    state.type === 'IndirectFunding.AWaitForLedgerUpdate1'
  );
}
