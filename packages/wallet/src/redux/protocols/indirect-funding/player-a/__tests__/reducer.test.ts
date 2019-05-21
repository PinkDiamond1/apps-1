import * as scenarios from './scenarios';
import { playerAReducer, initialize } from '../reducer';
import { ProtocolStateWithSharedData } from '../../../../protocols';
import { IndirectFundingState } from '../../states';
import { SignedCommitment } from '../../../../../domain';
import { getLastMessage } from '../../../../state';

describe('happy-path scenario', () => {
  const scenario = scenarios.happyPath;
  describe('initializing', () => {
    const { channelId, store, reply, processId } = scenario.initialParams;
    const initialState = initialize(processId, channelId, store);

    itTransitionsTo(initialState, 'IndirectFunding.AWaitForPreFundSetup1');
    itSendsMessage(initialState, reply);
  });

  describe('when in IndirectFunding.WaitForPreFundL1', () => {
    const { state, action } = scenario.waitForPreFundL1;
    const updatedState = playerAReducer(state.state, state.store, action);

    itTransitionsTo(updatedState, 'IndirectFunding.AWaitForDirectFunding');
  });
  describe('when in IndirectFunding.WaitForDirectFunding', () => {
    const { state, action, reply } = scenario.waitForDirectFunding;
    const updatedState = playerAReducer(state.state, state.store, action);

    itTransitionsTo(updatedState, 'IndirectFunding.AWaitForLedgerUpdate1');
    itSendsMessage(updatedState, reply);
  });

  describe('when in WaitForLedgerUpdate1', () => {
    const { state, action, reply } = scenario.waitForLedgerUpdate1;
    const updatedState = playerAReducer(state.state, state.store, action);

    itTransitionsTo(updatedState, 'IndirectFunding.AWaitForPostFundSetup1');
    itSendsMessage(updatedState, reply);
  });
  describe('when in IndirectFunding.WaitForPostFund1', () => {
    const { state, action } = scenario.waitForPostFund1;
    const updatedState = playerAReducer(state.state, state.store, action);

    itUpdatesFundingState(
      updatedState,
      scenario.initialParams.channelId,
      scenario.initialParams.ledgerId,
    );
    itTransitionsTo(updatedState, 'IndirectFunding.Success');
  });
});

describe('ledger-funding-fails scenario', () => {
  const scenario = scenarios.ledgerFundingFails;
  describe('when in IndirectFunding.WaitForDirectFunding', () => {
    const { state, action } = scenario.waitForDirectFunding;
    const updatedState = playerAReducer(state.state, state.store, action);

    itTransitionsTo(updatedState, 'IndirectFunding.Failure');
  });
});

// -------
// Helpers
// -------
type ReturnVal = ProtocolStateWithSharedData<IndirectFundingState>;

function itTransitionsTo(state: ReturnVal, type: IndirectFundingState['type']) {
  it(`transitions protocol state to ${type}`, () => {
    expect(state.protocolState.type).toEqual(type);
  });
}

function itSendsMessage(state: ReturnVal, message: SignedCommitment) {
  it('sends a message', () => {
    const lastMessage = getLastMessage(state.sharedData);
    if (lastMessage && 'messagePayload' in lastMessage) {
      const dataPayload = lastMessage.messagePayload;
      // This is yuk. The data in a message is currently of 'any' type..
      if (!('signedCommitment' in dataPayload)) {
        fail('No signedCommitment in the last message.');
      }
      const { commitment, signature } = dataPayload.signedCommitment;
      expect({ commitment, signature }).toEqual(message);
    } else {
      fail('No messages in the outbox.');
    }
  });
}

function itUpdatesFundingState(state: ReturnVal, channelId: string, fundingChannelId?: string) {
  it(`Updates the funding state to reflect ${channelId} funded by ${fundingChannelId}`, () => {
    if (!state.sharedData.fundingState[channelId]) {
      fail(`No entry for ${channelId} in fundingState`);
    } else {
      if (!fundingChannelId) {
        expect(state.sharedData.fundingState[channelId].directlyFunded).toBeTruthy();
      } else {
        expect(state.sharedData.fundingState[channelId].directlyFunded).toBeFalsy();
        expect(state.sharedData.fundingState[channelId].fundingChannel).toEqual(fundingChannelId);
      }
    }
  });
}
