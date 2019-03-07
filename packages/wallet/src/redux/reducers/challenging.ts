import * as states from '../states/challenging';
import * as runningStates from '../states/running';
import * as withdrawalStates from '../states/withdrawing';
import * as actions from '../actions';
import { WalletAction } from '../actions';
import { unreachable } from '../../utils/reducer-utils';
import { createForceMoveTransaction } from '../../utils/transaction-generator';
import {
  challengeCommitmentReceived,
  challengeComplete,
  hideWallet,
} from 'magmo-wallet-client/lib/wallet-events';
import { handleSignatureAndValidationMessages } from '../../utils/state-utils';
import { bigNumberify } from 'ethers/utils';
import { NextChannelState } from '../states/shared';
import { ChannelState } from '../states';

export const challengingReducer = (
  state: states.ChallengingState,
  action: WalletAction,
): NextChannelState<ChannelState> => {
  // Handle any signature/validation request centrally to avoid duplicating code for each state
  if (
    action.type === actions.OWN_COMMITMENT_RECEIVED ||
    action.type === actions.OPPONENT_COMMITMENT_RECEIVED
  ) {
    return {
      channelState: state,
      messageOutbox: handleSignatureAndValidationMessages(state, action),
    };
  }
  switch (state.type) {
    case states.APPROVE_CHALLENGE:
      return approveChallengeReducer(state, action);
    case states.WAIT_FOR_CHALLENGE_INITIATION:
      return initiateChallengeReducer(state, action);
    case states.WAIT_FOR_CHALLENGE_SUBMISSION:
      return waitForChallengeSubmissionReducer(state, action);
    case states.WAIT_FOR_CHALLENGE_CONFIRMATION:
      return waitForChallengeConfirmationReducer(state, action);
    case states.WAIT_FOR_RESPONSE_OR_TIMEOUT:
      return waitForResponseOrTimeoutReducer(state, action);
    case states.ACKNOWLEDGE_CHALLENGE_RESPONSE:
      return acknowledgeChallengeResponseReducer(state, action);
    case states.ACKNOWLEDGE_CHALLENGE_TIMEOUT:
      return acknowledgeChallengeTimeoutReducer(state, action);
    case states.CHALLENGE_TRANSACTION_FAILED:
      return challengeTransactionFailedReducer(state, action);
    default:
      return unreachable(state);
  }
};

const challengeTransactionFailedReducer = (
  state: states.ChallengeTransactionFailed,
  action: WalletAction,
): NextChannelState<ChannelState> => {
  switch (action.type) {
    case actions.RETRY_TRANSACTION:
      const { commitment: fromPosition, signature: fromSignature } = state.penultimateCommitment;
      const { commitment: toPosition, signature: toSignature } = state.lastCommitment;
      const transaction = createForceMoveTransaction(
        fromPosition,
        toPosition,
        fromSignature,
        toSignature,
      );
      return {
        channelState: states.waitForChallengeInitiation(state),
        transactionOutbox: transaction,
      };
  }
  return { channelState: state };
};

const approveChallengeReducer = (
  state: states.ApproveChallenge,
  action: WalletAction,
): NextChannelState<ChannelState> => {
  switch (action.type) {
    case actions.CHALLENGE_APPROVED:
      const { commitment: fromPosition, signature: fromSignature } = state.penultimateCommitment;
      const { commitment: toPosition, signature: toSignature } = state.lastCommitment;
      const transaction = createForceMoveTransaction(
        fromPosition,
        toPosition,
        fromSignature,
        toSignature,
      );
      return {
        channelState: states.waitForChallengeInitiation(state),
        transactionOutbox: transaction,
      };
    case actions.CHALLENGE_REJECTED:
      return {
        channelState: runningStates.waitForUpdate(state),
        messageOutbox: challengeComplete(),
        displayOutbox: hideWallet(),
      };
    default:
      return { channelState: state };
  }
};

const initiateChallengeReducer = (
  state: states.WaitForChallengeInitiation,
  action: WalletAction,
): NextChannelState<ChannelState> => {
  switch (action.type) {
    case actions.TRANSACTION_SENT_TO_METAMASK:
      return { channelState: states.waitForChallengeSubmission(state) };
    default:
      return { channelState: state };
  }
};

const waitForChallengeSubmissionReducer = (
  state: states.WaitForChallengeSubmission,
  action: WalletAction,
): NextChannelState<ChannelState> => {
  switch (action.type) {
    case actions.CHALLENGE_CREATED_EVENT:
      return {
        channelState: states.waitForChallengeSubmission({
          ...state,
          challengeExpiry: bigNumberify(action.finalizedAt).toNumber(),
        }),
      };
    case actions.TRANSACTION_SUBMITTED:
      return {
        channelState: states.waitForChallengeConfirmation({
          ...state,
          transactionHash: action.transactionHash,
        }),
      };
    case actions.TRANSACTION_SUBMISSION_FAILED:
      return { channelState: states.challengeTransactionFailed(state) };
    default:
      return { channelState: state };
  }
};

const waitForChallengeConfirmationReducer = (
  state: states.WaitForChallengeConfirmation,
  action: WalletAction,
): NextChannelState<ChannelState> => {
  switch (action.type) {
    case actions.CHALLENGE_CREATED_EVENT:
      return {
        channelState: states.waitForChallengeConfirmation({
          ...state,
          challengeExpiry: bigNumberify(action.finalizedAt).toNumber(),
        }),
      };
    case actions.TRANSACTION_CONFIRMED:
      // This is a best guess on when the challenge will expire and will be updated by the challenge created event
      // TODO: Mover challenge duration to a shared constant
      const challengeExpiry = state.challengeExpiry
        ? state.challengeExpiry
        : new Date(Date.now() + 5 * 60000).getTime() / 1000;
      return { channelState: states.waitForResponseOrTimeout({ ...state, challengeExpiry }) };
    default:
      return { channelState: state };
  }
};

const waitForResponseOrTimeoutReducer = (
  state: states.WaitForResponseOrTimeout,
  action: WalletAction,
): NextChannelState<ChannelState> => {
  switch (action.type) {
    case actions.CHALLENGE_CREATED_EVENT:
      return {
        channelState: states.waitForResponseOrTimeout({
          ...state,
          challengeExpiry: bigNumberify(action.finalizedAt).toNumber(),
        }),
      };
    case actions.RESPOND_WITH_MOVE_EVENT:
      const message = challengeCommitmentReceived(action.responseCommitment);
      // TODO: Right now we're just storing a dummy signature since we don't get one
      // from the challenge.
      return {
        channelState: states.acknowledgeChallengeResponse({
          ...state,
          turnNum: state.turnNum + 1,
          lastCommitment: { commitment: action.responseCommitment, signature: '0x0' },
          penultimatePosition: state.lastCommitment,
        }),
        messageOutbox: message,
      };

    case actions.BLOCK_MINED:
      if (
        typeof state.challengeExpiry !== 'undefined' &&
        action.block.timestamp >= state.challengeExpiry
      ) {
        return { channelState: states.acknowledgeChallengeTimeout(state) };
      } else {
        return { channelState: state };
      }

    default:
      return { channelState: state };
  }
};

const acknowledgeChallengeResponseReducer = (
  state: states.AcknowledgeChallengeResponse,
  action: WalletAction,
): NextChannelState<ChannelState> => {
  switch (action.type) {
    case actions.CHALLENGE_RESPONSE_ACKNOWLEDGED:
      return {
        channelState: runningStates.waitForUpdate(state),
        messageOutbox: challengeComplete(),
        displayOutbox: hideWallet(),
      };
    default:
      return { channelState: state };
  }
};

const acknowledgeChallengeTimeoutReducer = (
  state: states.AcknowledgeChallengeTimeout,
  action: WalletAction,
): NextChannelState<ChannelState> => {
  switch (action.type) {
    case actions.CHALLENGE_TIME_OUT_ACKNOWLEDGED:
      return {
        channelState: withdrawalStates.approveWithdrawal(state),
        messageOutbox: challengeComplete(),
      };
    default:
      return { channelState: state };
  }
};
