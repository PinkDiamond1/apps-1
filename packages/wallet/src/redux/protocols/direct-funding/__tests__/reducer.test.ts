import * as actions from '../../../actions';
import * as globalTestScenarios from '../../../__tests__/test-scenarios';
import { directFundingStateReducer } from '../reducer';
import * as states from '../states';
import * as scenarios from './scenarios';
import * as transactionSubmissionStates from '../../transaction-submission/states';
import { ProtocolStateWithSharedData } from '../..';
import { bigNumberify } from 'ethers/utils';
import { expectThisCommitmentSent, itStoresThisCommitment } from '../../../__tests__/helpers';

const { channelId } = globalTestScenarios;

const startingIn = stage => `start in ${stage}`;
const whenActionArrives = action => `incoming action ${action}`;

describe(startingIn('Any state'), () => {
  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    describe("When it's for the correct channel", () => {
      describe('when the channel is now funded', () => {
        const state = scenarios.aEachDepositsInSequenceHappyStates.notSafeToDeposit;
        const action = actions.fundingReceivedEvent(
          channelId,
          channelId,
          scenarios.TOTAL_REQUIRED,
          scenarios.TOTAL_REQUIRED,
        );
        const updatedState = directFundingStateReducer(
          state.protocolState,
          state.sharedData,
          action,
        );
        itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
        expectThisCommitmentSent(updatedState.sharedData, globalTestScenarios.postFundCommitment0);
      });
      describe('when the channel is still not funded', () => {
        const state = scenarios.bEachDepositsInSequenceHappyStates.notSafeToDeposit;
        const action = actions.fundingReceivedEvent(
          channelId,
          channelId,
          bigNumberify(1).toHexString(),
          bigNumberify(1).toHexString(),
        );
        const updatedState = directFundingStateReducer(
          state.protocolState,
          state.sharedData,
          action,
        );
        itTransitionsTo(updatedState, 'DirectFunding.NotSafeToDeposit');
      });
    });

    describe("When it's for another channels", () => {
      const state = scenarios.aEachDepositsInSequenceHappyStates.notSafeToDeposit;
      const action = actions.fundingReceivedEvent(
        channelId,
        '0xf00',
        scenarios.TOTAL_REQUIRED,
        scenarios.TOTAL_REQUIRED,
      );
      const updatedState = directFundingStateReducer(state.protocolState, state.sharedData, action);
      itTransitionsTo(updatedState, 'DirectFunding.NotSafeToDeposit');
    });
  });
});

describe(startingIn('DirectFunding.NotSafeToDeposit'), () => {
  // player B scenario
  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    describe('when it is now safe to deposit', () => {
      const state = scenarios.bEachDepositsInSequenceHappyStates.notSafeToDeposit;
      const action = actions.fundingReceivedEvent(
        channelId,
        channelId,
        scenarios.YOUR_DEPOSIT_A,
        scenarios.YOUR_DEPOSIT_A,
      );
      const updatedState = directFundingStateReducer(state.protocolState, state.sharedData, action);

      itTransitionsTo(updatedState, 'DirectFunding.WaitForDepositTransaction');
      itChangesTransactionSubmissionStatusTo(
        ((updatedState.protocolState as any) as states.WaitForDepositTransaction)
          .transactionSubmissionState,
        'TransactionSubmission.WaitForSend',
      );
    });

    describe('when it is still not safe to deposit', () => {
      const state = scenarios.bEachDepositsInSequenceHappyStates.notSafeToDeposit;
      const action = actions.fundingReceivedEvent(channelId, channelId, '0x', '0x');
      const updatedState = directFundingStateReducer(state.protocolState, state.sharedData, action);

      itTransitionsTo(updatedState, 'DirectFunding.NotSafeToDeposit');
    });
  });
});

describe(startingIn('DirectFunding.WaitForDepositTransaction'), () => {
  describe(whenActionArrives('TransactionConfirmed'), () => {
    const state = scenarios.aEachDepositsInSequenceHappyStates.waitForDepositTransactionEnd;
    const action = actions.transactionConfirmed(channelId);

    const updatedState = directFundingStateReducer(state.protocolState, state.sharedData, action);
    itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
  });

  describe(whenActionArrives('CommitmentReceived'), () => {
    const state = scenarios.bEachDepositsInSequenceHappyStates.waitForDepositTransactionEnd;

    const updatedState = directFundingStateReducer(
      state.protocolState,
      state.sharedData,
      scenarios.actions.postFundSetup0,
    );
    itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
    const protocolState = updatedState.protocolState;
    if (protocolState.type === 'DirectFunding.WaitForFundingAndPostFundSetup') {
      expect(protocolState.channelFunded).toBeFalsy();
      expect(protocolState.postFundSetupReceived).toBeTruthy();
    }
  });
});

describe(startingIn('DirectFunding.WaitForFundingAndPostFundSetup'), () => {
  describe(whenActionArrives(actions.FUNDING_RECEIVED_EVENT), () => {
    describe('when it is now fully funded', () => {
      const state = scenarios.bEachDepositsInSequenceHappyStates.waitForFundingAndPostFundSetup;
      const action = actions.fundingReceivedEvent(
        channelId,
        channelId,
        scenarios.YOUR_DEPOSIT_B,
        scenarios.TOTAL_REQUIRED,
      );
      const updatedState = directFundingStateReducer(state.protocolState, state.sharedData, action);

      itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
    });

    describe('when it is still not fully funded', () => {
      const state = scenarios.bEachDepositsInSequenceHappyStates.waitForFundingAndPostFundSetup;
      const action = actions.fundingReceivedEvent(
        channelId,
        channelId,
        '0x',
        scenarios.YOUR_DEPOSIT_A,
      );
      const updatedState = directFundingStateReducer(state.protocolState, state.sharedData, action);

      itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
    });

    describe('when it is for the wrong channel', () => {
      const state = scenarios.bEachDepositsInSequenceHappyStates.waitForFundingAndPostFundSetup;
      const action = actions.fundingReceivedEvent(
        channelId,
        '0 xf00',
        scenarios.TOTAL_REQUIRED,
        scenarios.TOTAL_REQUIRED,
      );
      const updatedState = directFundingStateReducer(state.protocolState, state.sharedData, action);

      itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
    });
  });

  describe(whenActionArrives('CommitmentReceived'), () => {
    describe('Player B: channel is funded', () => {
      const state = scenarios.bEachDepositsInSequenceHappyStates.waitForPostFundSetup;
      const updatedState = directFundingStateReducer(
        state.protocolState,
        state.sharedData,
        scenarios.actions.postFundSetup0,
      );
      itTransitionsTo(updatedState, 'DirectFunding.FundingSuccess');
      it('sends a commitment', () => {
        expectThisCommitmentSent(updatedState.sharedData, globalTestScenarios.postFundCommitment1);
      });
    });

    describe('Player B: channel is not funded', () => {
      const state = scenarios.bEachDepositsInSequenceHappyStates.waitForFundingAndPostFundSetup;
      const incomingCommitment = scenarios.actions.postFundSetup0.signedCommitment;
      const updatedState = directFundingStateReducer(
        state.protocolState,
        state.sharedData,
        scenarios.actions.postFundSetup0,
      );
      itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
      const protocolState = updatedState.protocolState;
      if (protocolState.type === 'DirectFunding.WaitForFundingAndPostFundSetup') {
        expect(protocolState.channelFunded).toBeFalsy();
        expect(protocolState.postFundSetupReceived).toBeTruthy();
      }

      itStoresThisCommitment(updatedState.sharedData, incomingCommitment);
    });

    describe('Player A: channel is funded', () => {
      const state = scenarios.aEachDepositsInSequenceHappyStates.waitForPostFundSetup;
      const updatedState = directFundingStateReducer(
        state.protocolState,
        state.sharedData,
        scenarios.actions.postFundSetup1,
      );
      itTransitionsTo(updatedState, 'DirectFunding.FundingSuccess');
    });

    describe('Player A: channel is not funded', () => {
      const state = scenarios.aEachDepositsInSequenceHappyStates.waitForFundingAndPostFundSetup;
      const updatedState = directFundingStateReducer(
        state.protocolState,
        state.sharedData,
        scenarios.actions.postFundSetup0,
      );
      itTransitionsTo(updatedState, 'DirectFunding.WaitForFundingAndPostFundSetup');
      const protocolState = updatedState.protocolState;
      if (protocolState.type === 'DirectFunding.WaitForFundingAndPostFundSetup') {
        expect(protocolState.channelFunded).toBeFalsy();
        expect(protocolState.postFundSetupReceived).toBeFalsy();
      }
    });
  });
});

describe('transaction-fails scenario', () => {
  describe('when in WaitForDepositTransaction', () => {
    const state = scenarios.transactionFails.waitForDepositTransaction;
    const action = scenarios.transactionFails.failureTrigger;
    const updatedState = directFundingStateReducer(state.protocolState, state.sharedData, action);

    itTransitionsTo(updatedState, 'DirectFunding.FundingFailure');
  });
});

function itTransitionsTo(
  state: ProtocolStateWithSharedData<states.DirectFundingState>,
  type: states.DirectFundingStateType,
) {
  it(`transitions state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}

function itChangesTransactionSubmissionStatusTo(
  state: transactionSubmissionStates.TransactionSubmissionState,
  status: transactionSubmissionStates.TransactionSubmissionState['type'],
) {
  it(`changes transaction submission state to ${status}`, () => {
    expect(state.type).toEqual(status);
  });
}
