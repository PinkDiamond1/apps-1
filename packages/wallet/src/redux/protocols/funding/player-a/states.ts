import { Properties as P } from '../../../utils';

export type FundingState =
  | WaitForStrategyChoice
  | WaitForStrategyResponse
  | WaitForFunding
  | WaitForPostFundSetup
  | WaitForSuccessConfirmation
  | Success
  | Failure;

export const WAIT_FOR_STRATEGY_CHOICE = 'WaitForStrategyChoice';
export const WAIT_FOR_STRATEGY_RESPONSE = 'WaitForStrategyResponse';
export const WAIT_FOR_FUNDING = 'WaitForFunding';
export const WAIT_FOR_POSTFUND_SETUP = 'WaitForPostFundSetup';
export const WAIT_FOR_SUCCESS_CONFIRMATION = 'WaitForSuccessConfirmation';
export const FAILURE = 'Failure';
export const SUCCESS = 'Success';

interface BaseState {
  processId: string;
  opponentAddress: string;
}

export interface WaitForStrategyChoice extends BaseState {
  type: typeof WAIT_FOR_STRATEGY_CHOICE;
  targetChannelId: string;
}

export interface WaitForStrategyResponse extends BaseState {
  type: typeof WAIT_FOR_STRATEGY_RESPONSE;
  targetChannelId: string;
}

export interface WaitForFunding extends BaseState {
  type: typeof WAIT_FOR_FUNDING;
  fundingState: 'funding state';
}

export interface WaitForPostFundSetup extends BaseState {
  type: typeof WAIT_FOR_POSTFUND_SETUP;
}

export interface WaitForSuccessConfirmation extends BaseState {
  type: typeof WAIT_FOR_SUCCESS_CONFIRMATION;
}

export interface Failure {
  type: typeof FAILURE;
  reason: string;
}

export interface Success {
  type: typeof SUCCESS;
}

// -------
// Helpers
// -------

export function isTerminal(state: FundingState): state is Failure | Success {
  return state.type === FAILURE || state.type === SUCCESS;
}

// ------------
// Constructors
// ------------

export function waitForStrategyChoice(p: P<WaitForStrategyChoice>): WaitForStrategyChoice {
  const { processId, opponentAddress, targetChannelId } = p;
  return { type: WAIT_FOR_STRATEGY_CHOICE, processId, targetChannelId, opponentAddress };
}

export function waitForStrategyResponse(p: P<WaitForStrategyResponse>): WaitForStrategyResponse {
  const { processId, opponentAddress, targetChannelId } = p;
  return { type: WAIT_FOR_STRATEGY_RESPONSE, processId, opponentAddress, targetChannelId };
}

export function waitForFunding(p: P<WaitForFunding>): WaitForFunding {
  const { processId, opponentAddress, fundingState } = p;
  return { type: WAIT_FOR_FUNDING, processId, opponentAddress, fundingState };
}

export function waitForPostFundSetup(p: P<WaitForPostFundSetup>): WaitForPostFundSetup {
  const { processId, opponentAddress } = p;
  return { type: WAIT_FOR_POSTFUND_SETUP, processId, opponentAddress };
}

export function waitForSuccessConfirmation(
  p: P<WaitForSuccessConfirmation>,
): WaitForSuccessConfirmation {
  const { processId, opponentAddress } = p;
  return { type: WAIT_FOR_SUCCESS_CONFIRMATION, processId, opponentAddress };
}

export function success(): Success {
  return { type: SUCCESS };
}

export function failure(reason: string): Failure {
  return { type: FAILURE, reason };
}
