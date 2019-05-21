import * as scenarios from './scenarios';
import { playerBReducer, initialize } from '../reducer';
import { ProtocolStateWithSharedData } from '../../../../protocols';
import { IndirectFundingState, IndirectFundingStateType } from '../../states';
import { SignedCommitment } from '../../../../../domain';
import { getLastMessage } from '../../../../state';

describe('happy-path scenario', () => {
  const scenario = scenarios.happyPath;
  describe('initializing', () => {
    const { channelId, store, processId } = scenario.initialParams;
    const initialState = initialize(processId, channelId, store);

    itTransitionsTo(initialState, 'IndirectFunding.BWaitForPreFundSetup0');
  });

  describe('when in WaitForPreFundSetup0', () => {
    const { state, action, reply } = scenario.waitForPreFundSetup0;
    const updatedState = playerBReducer(state.state, state.store, action);

    itSendsMessage(updatedState, reply);
    itTransitionsTo(updatedState, 'IndirectFunding.BWaitForDirectFunding');
  });
  describe('when in WaitForDirectFunding', () => {
    const { state, action } = scenario.waitForDirectFunding;
    const updatedState = playerBReducer(state.state, state.store, action);

    itTransitionsTo(updatedState, 'IndirectFunding.BWaitForLedgerUpdate0');
  });
  describe('when in WaitForLedgerUpdate0', () => {
    const { state, action, reply } = scenario.waitForLedgerUpdate0;
    const updatedState = playerBReducer(state.state, state.store, action);

    itTransitionsTo(updatedState, 'IndirectFunding.BWaitForPostFundSetup0');
    itSendsMessage(updatedState, reply);
  });
  describe('when in WaitForPostFund0', () => {
    const { state, action, reply } = scenario.waitForPostFund0;
    const updatedState = playerBReducer(state.state, state.store, action);
    itUpdatesFundingState(
      updatedState,
      scenario.initialParams.channelId,
      scenario.initialParams.ledgerId,
    );
    itTransitionsTo(updatedState, 'IndirectFunding.Success');
    itSendsMessage(updatedState, reply);
  });
});

describe('ledger-funding-fails scenario', () => {
  const scenario = scenarios.ledgerFundingFails;
  describe('when in WaitForDirectFunding', () => {
    const { state, action } = scenario.waitForDirectFunding;
    const updatedState = playerBReducer(state.state, state.store, action);

    itTransitionsTo(updatedState, 'IndirectFunding.Failure');
  });
});

// -------
// Helpers
// -------
type ReturnVal = ProtocolStateWithSharedData<IndirectFundingState>;

function itTransitionsTo(state: ReturnVal, type: IndirectFundingStateType) {
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
