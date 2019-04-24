import { Properties as P } from '../../utils';

export type ConcludingState = NonTerminalState | TerminalState;
export type ConcludingStateType = ConcludingState['type'];

export type NonTerminalState =
  | AcknowledgeConcludingImpossible
  | ApproveConcluding
  | WaitForOpponentConclude
  | AcknowledgeChannelConcluded
  | WaitForDefund;

export type TerminalState = Success | Failure;

export type FailureReason = 'NotYourTurn' | 'ChannelDoesntExist' | 'ResignCancelled';

export interface AcknowledgeConcludingImpossible {
  type: 'AcknowledgeConcludingImpossible';
  processId: string;
}
export interface ApproveConcluding {
  type: 'ApproveConcluding';
  processId: string;
}

export interface WaitForOpponentConclude {
  type: 'WaitForOpponentConclude';
  processId: string;
}

export interface AcknowledgeChannelConcluded {
  type: 'AcknowledgeChannelConcluded';
  processId: string;
}

export interface WaitForDefund {
  type: 'WaitForDefund';
  processId: string;
}

export interface Failure {
  type: 'Failure';
  reason: FailureReason;
}

export interface Success {
  type: 'Success';
}

// -------
// Helpers
// -------

export function isTerminal(state: ConcludingState): state is Failure | Success {
  return state.type === 'Failure' || state.type === 'Success';
}

export function isSuccess(state: ConcludingState): state is Success {
  return state.type === 'Success';
}

export function isFailure(state: ConcludingState): state is Failure {
  return state.type === 'Failure';
}

// ------------
// Constructors
// ------------
export function acknowledgeConcludingImpossible(
  p: P<AcknowledgeConcludingImpossible>,
): AcknowledgeConcludingImpossible {
  const { processId } = p;
  return { type: 'AcknowledgeConcludingImpossible', processId };
}

export function approveConcluding(p: P<ApproveConcluding>): ApproveConcluding {
  const { processId } = p;
  return { type: 'ApproveConcluding', processId };
}

export function waitForOpponentConclude(p: P<WaitForOpponentConclude>): WaitForOpponentConclude {
  const { processId } = p;
  return { type: 'WaitForOpponentConclude', processId };
}

export function acknowledgeChannelConcluded(
  p: P<AcknowledgeChannelConcluded>,
): AcknowledgeChannelConcluded {
  const { processId } = p;
  return { type: 'AcknowledgeChannelConcluded', processId };
}

export function waitForDefund(p: P<WaitForDefund>): WaitForDefund {
  const { processId } = p;
  return { type: 'WaitForDefund', processId };
}

export function success(): Success {
  return { type: 'Success' };
}

export function failure(p: P<Failure>): Failure {
  const { reason } = p;
  return { type: 'Failure', reason };
}
