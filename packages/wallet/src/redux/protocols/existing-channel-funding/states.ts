import { StateConstructor } from '../../utils';
import { ProtocolState } from '..';

export interface WaitForLedgerTopUp {
  type: 'ExistingChannelFunding.WaitForLedgerTopUp';
  processId: string;
  ledgerTopUpState: any;
  channelId: string;
  ledgerId: string;
}

export interface WaitForLedgerUpdate {
  type: 'ExistingChannelFunding.WaitForLedgerUpdate';
  processId: string;
  channelId: string;
  ledgerId: string;
}

export interface Failure {
  type: 'ExistingChannelFunding.Failure';
  reason: string;
}

export interface Success {
  type: 'ExistingChannelFunding.Success';
}

export const waitForLedgerUpdate: StateConstructor<WaitForLedgerUpdate> = p => {
  return {
    ...p,
    type: 'ExistingChannelFunding.WaitForLedgerUpdate',
  };
};

export const waitForLedgerTopUp: StateConstructor<WaitForLedgerTopUp> = p => {
  return {
    ...p,
    type: 'ExistingChannelFunding.WaitForLedgerTopUp',
  };
};
export const success: StateConstructor<Success> = p => {
  return { ...p, type: 'ExistingChannelFunding.Success' };
};

export const failure: StateConstructor<Failure> = p => {
  return { ...p, type: 'ExistingChannelFunding.Failure' };
};

export type ExistingChannelFundingState =
  | WaitForLedgerTopUp
  | WaitForLedgerUpdate
  | Success
  | Failure;

export function isExistingChannelFundingState(
  state: ProtocolState,
): state is ExistingChannelFundingState {
  return state.type.indexOf('ExistingChannelFunding') === 0;
}

export function isTerminal(state: ExistingChannelFundingState): state is Success | Failure {
  return (
    state.type === 'ExistingChannelFunding.Failure' ||
    state.type === 'ExistingChannelFunding.Success'
  );
}
