import * as states from './state';
import * as actions from '../actions';

import { ReducerWithSideEffects, combineReducersWithSideEffects } from '../../utils/reducer-utils';

import { StateWithSideEffects } from '../shared/state';
import { bigNumberify } from 'ethers/utils';
import { createDepositTransaction } from '../../utils/transaction-generator';

export const fundingStateReducer = (
  state: states.FundingState,
  action: actions.WalletAction,
): StateWithSideEffects<states.FundingState> => {
  switch (action.type) {
    case actions.internal.DIRECT_FUNDING_REQUESTED:
      const {
        safeToDepositLevel,
        totalFundingRequired,
        requiredDeposit,
        channelId,
        ourIndex,
      } = action;

      const alreadySafeToDeposit = bigNumberify(safeToDepositLevel).eq('0x');
      const alreadyFunded = bigNumberify(totalFundingRequired).eq('0x');

      const channelFundingStatus = alreadyFunded
        ? states.CHANNEL_FUNDED
        : alreadySafeToDeposit
        ? states.SAFE_TO_DEPOSIT
        : states.NOT_SAFE_TO_DEPOSIT;

      const stateConstructor: any = alreadyFunded
        ? states.channelFunded
        : alreadySafeToDeposit
        ? states.depositing.waitForTransactionSent
        : states.notSafeToDeposit;

      const transactionOutbox = alreadySafeToDeposit
        ? {
            transactionRequest: createDepositTransaction(action.channelId, action.requiredDeposit),
            channelId,
          }
        : undefined;

      return {
        state: {
          ...state,
          directFunding: {
            ...state.directFunding,
            [channelId]: stateConstructor({
              ...state,
              fundingType: states.DIRECT_FUNDING,
              channelFundingStatus,
              safeToDepositLevel,
              channelId,
              requestedTotalFunds: totalFundingRequired,
              requestedYourContribution: requiredDeposit,
              ourIndex,
            }),
          },
        },
        sideEffects: { transactionOutbox },
      };
    default:
      return combinedReducer(state, action);
  }
};

const directFunding: ReducerWithSideEffects<states.DirectFundingState> = (
  state,
  action: actions.funding.FundingAction,
) => {
  return { state };
};

const indirectFunding: ReducerWithSideEffects<states.IndirectFundingState> = (state, action) => {
  return { state };
};

const combinedReducer = combineReducersWithSideEffects({
  directFunding,
  indirectFunding,
});
