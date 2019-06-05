import { SharedData } from '../../state';
import * as states from './states';
import { ProtocolStateWithSharedData, ProtocolReducer } from '..';
import * as actions from './actions';
export function initialize(
  processId: string,
  channelId: string,
  ledgerId: string,
  proposedAllocation: string[],
  proposedDestination: string[],
  sharedData: SharedData,
): ProtocolStateWithSharedData<states.LedgerTopUpState> {
  return {
    protocolState: states.success({}),
    sharedData,
  };
}

export const ledgerTopUpReducer: ProtocolReducer<states.LedgerTopUpState> = (
  protocolState: states.LedgerTopUpState,
  sharedData: SharedData,
  action: actions.LedgerTopUpAction,
): ProtocolStateWithSharedData<states.LedgerTopUpState> => {
  return { protocolState, sharedData };
};
