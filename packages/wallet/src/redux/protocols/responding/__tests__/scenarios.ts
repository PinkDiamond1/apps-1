import * as states from '../state';
import * as actions from '../actions';
import * as testScenarios from '../../../__tests__/test-scenarios';
import * as transactionScenarios from '../../transaction-submission/__tests__/scenarios';
import { emptyState } from '../../../state';

import {
  ChannelStatus,
  RUNNING,
  WAIT_FOR_UPDATE,
  ChannelState,
} from '../../../channel-state/state';
import { SharedData } from '../..';
import * as transactionActions from '../../transaction-submission/actions';

// ---------
// Test data
// ---------

const {
  asAddress: address,
  asPrivateKey: privateKey,
  channelId,
  libraryAddress,
  participants,
  channelNonce,
  alternativeGameCommitment2,
  gameCommitment1,
  gameCommitment2,
} = testScenarios;

const channelStatus: ChannelStatus = {
  address,
  privateKey,
  stage: RUNNING,
  type: WAIT_FOR_UPDATE,
  channelId,
  libraryAddress,
  ourIndex: 0,
  participants,
  channelNonce,
  funded: true,
  lastCommitment: { commitment: gameCommitment2, signature: '0x0' },
  penultimateCommitment: { commitment: gameCommitment1, signature: '0x0' },
  turnNum: gameCommitment2.turnNum,
};
const channelState: ChannelState = {
  initializingChannels: {},
  initializedChannels: {
    [channelId]: channelStatus,
  },
};
const transactionSubmissionState = transactionScenarios.happyPath.waitForConfirmation;
const processId = 'process-id.123';
const sharedData: SharedData = { ...emptyState, channelState };
const props = { processId, transactionSubmissionState, sharedData };

// ------
// States
// ------
const waitForApprovalRefute = states.waitForApproval({
  ...props,
  challengeCommitment: alternativeGameCommitment2,
});
const waitForApprovalRespond = states.waitForApproval({
  ...props,
  challengeCommitment: gameCommitment1,
});
const waitForApprovalRequiresResponse = states.waitForApproval({
  ...props,
  challengeCommitment: gameCommitment2,
});
const waitForTransaction = states.waitForTransaction(props);
const waitForAcknowledgement = states.waitForAcknowledgement(props);
const waitForResponse = states.waitForResponse(props);
const success = states.success();
const userRejectedFailure = states.failure(states.FailureReason.UserRejected);
const transactionFailedFailure = states.failure(states.FailureReason.TransactionFailure);
const transactionConfirmed = transactionActions.transactionConfirmed(processId);
const transactionFailed = transactionActions.transactionFailed(processId);
// ------
// Actions
// ------
const approve = actions.respondApproved(processId);
const reject = actions.respondRejected(processId);
const acknowledge = actions.respondSuccessAcknowledged(processId);
const responseProvided = actions.responseProvided(processId, testScenarios.gameCommitment3);

// ---------
// Scenarios
// ---------
export const respondWithExistingCommitmentHappyPath = {
  ...props,
  challengeCommitment: gameCommitment1,
  // States
  waitForApproval: waitForApprovalRespond,
  waitForTransaction,
  waitForAcknowledgement,
  success,
  // Actions
  approve,
  transactionConfirmed,
  acknowledge,
};

export const refuteHappyPath = {
  ...props,
  // States
  waitForApproval: waitForApprovalRefute,
  waitForTransaction,
  waitForAcknowledgement,
  success,
  // Actions
  approve,
  transactionConfirmed,
  acknowledge,
};

export const requireResponseHappyPath = {
  ...props,
  challengeCommitment: gameCommitment1,
  // States
  waitForApproval: waitForApprovalRequiresResponse,
  waitForResponse,
  waitForTransaction,
  waitForAcknowledgement,
  success,
  // Actions
  approve,
  responseProvided,
  transactionConfirmed,
  acknowledge,
};

export const userDeclines = {
  ...props,
  // States
  waitForApproval: waitForApprovalRequiresResponse,
  failure: userRejectedFailure,
  // Action
  reject,
};

export const transactionFails = {
  ...props,
  // States
  waitForApproval: waitForApprovalRespond,
  waitForTransaction,
  failure: transactionFailedFailure,
  // Actions
  approve,
  transactionFailed,
};
