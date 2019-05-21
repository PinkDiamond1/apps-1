import { Constructor } from '../../utils';
import { TransactionRequest } from 'ethers/providers';

// -------
// States
// -------

export type FailureReason = 'TransactionFailed' | 'UserDeclinedRetry';

export interface WaitForSend {
  type: 'TransactionSubmission.WaitForSend';
  transaction: TransactionRequest;
  processId: string;
}

export interface WaitForSubmission {
  type: 'TransactionSubmission.WaitForSubmission';
  transaction: TransactionRequest;
  processId: string;
}

export interface WaitForConfirmation {
  type: 'TransactionSubmission.WaitForConfirmation';
  transaction: TransactionRequest;
  transactionHash: string;
  processId: string;
}

export interface ApproveRetry {
  type: 'TransactionSubmission.ApproveRetry';
  transaction: TransactionRequest;
  processId: string;
}

export interface Failure {
  type: 'TransactionSubmission.Failure';
  reason: FailureReason;
}

export interface Success {
  type: 'TransactionSubmission.Success';
}

// -------
// Helpers
// -------

export function isTerminal(state: TransactionSubmissionState): state is Failure | Success {
  return (
    state.type === 'TransactionSubmission.Failure' || state.type === 'TransactionSubmission.Success'
  );
}

export function isSuccess(state: TransactionSubmissionState): state is Success {
  return state.type === 'TransactionSubmission.Success';
}

export function isFailure(state: TransactionSubmissionState): state is Failure {
  return state.type === 'TransactionSubmission.Failure';
}

// ------------
// Constructors
// ------------

export const waitForSend: Constructor<WaitForSend> = p => {
  const { transaction, processId } = p;
  return { type: 'TransactionSubmission.WaitForSend', transaction, processId };
};

export const waitForSubmission: Constructor<WaitForSubmission> = p => {
  const { transaction, processId } = p;
  return { type: 'TransactionSubmission.WaitForSubmission', transaction, processId };
};

export const approveRetry: Constructor<ApproveRetry> = p => {
  const { transaction, processId } = p;
  return { type: 'TransactionSubmission.ApproveRetry', transaction, processId };
};

export const waitForConfirmation: Constructor<WaitForConfirmation> = p => {
  const { transaction, transactionHash, processId } = p;
  return {
    type: 'TransactionSubmission.WaitForConfirmation',
    transaction,
    transactionHash,
    processId,
  };
};

export function success({}): Success {
  return { type: 'TransactionSubmission.Success' };
}

export function failure(reason: FailureReason): Failure {
  return { type: 'TransactionSubmission.Failure', reason };
}

// -------
// Unions and Guards
// -------

export type TransactionSubmissionState = NonTerminalTransactionSubmissionState | Success | Failure;
export type TransactionSubmissionStateType = TransactionSubmissionState['type'];

export type NonTerminalTransactionSubmissionState =
  | WaitForSend
  | WaitForSubmission
  | WaitForConfirmation
  | ApproveRetry;
