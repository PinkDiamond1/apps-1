import { Commitment as C, CommitmentType as CT } from 'fmg-core';
import { validCommitmentSignature, signCommitment as signCommitmentUtil } from '../signing-utils';
import { channelID } from 'fmg-core/lib/channel';
import { appAttributesFromBytes, bytesFromAppAttributes } from 'fmg-nitro-adjudicator';

export type Commitment = C;
export const CommitmentType = CT;
export type CommitmentType = CT;

export interface SignedCommitment {
  commitment: Commitment;
  signature: string;
}

// -------
// Helpers
// -------

// temporary name while we remove the old signCommitment method
export function signCommitment2(commitment: Commitment, privateKey: string): SignedCommitment {
  return { commitment, signature: signCommitmentUtil(commitment, privateKey) };
}

function getTurnTaker(commitment: Commitment): string {
  const { turnNum, channel } = commitment;
  const participants = channel.participants;
  const numParticipants = participants.length;
  return participants[turnNum % numParticipants];
}

export function hasValidSignature(signedCommitment: SignedCommitment): boolean {
  const { commitment, signature } = signedCommitment;
  const address = getTurnTaker(commitment);
  return validCommitmentSignature(commitment, signature, address);
}

export function getChannelId(commitment: Commitment): string {
  return channelID(commitment.channel);
}

function incrementTurnNum(commitment: Commitment): Commitment {
  return { ...commitment, turnNum: commitment.turnNum + 1 };
}

export function constructConclude(commitment: Commitment): Commitment {
  return { ...incrementTurnNum(commitment), commitmentType: CommitmentType.Conclude };
}

export function nextLedgerUpdateCommitment(
  commitment: Commitment,
): Commitment | 'NotAnUpdateCommitment' {
  if (commitment.commitmentType !== CommitmentType.App || commitment.turnNum > 4) {
    return 'NotAnUpdateCommitment';
  }
  const appAttributes = appAttributesFromBytes(commitment.appAttributes);
  const updatedAppAttributes = bytesFromAppAttributes({ ...appAttributes, consensusCounter: 0 });
  return {
    ...commitment,
    allocation: appAttributes.proposedAllocation,
    destination: appAttributes.proposedDestination,
    appAttributes: updatedAppAttributes,
    turnNum: commitment.turnNum + 1,
    commitmentCount: 0,
  };
}

export function nextSetupCommitment(commitment: Commitment): Commitment | 'NotASetupCommitment' {
  const turnNum = commitment.turnNum + 1;
  const numParticipants = commitment.channel.participants.length;
  let commitmentType;
  let commitmentCount;
  if (turnNum < numParticipants) {
    commitmentType = CommitmentType.PreFundSetup;
    commitmentCount = turnNum;
  } else if (turnNum < 2 * numParticipants - 1) {
    commitmentType = CommitmentType.PostFundSetup;
    commitmentCount = turnNum - numParticipants;
  } else {
    return 'NotASetupCommitment';
  }

  return { ...commitment, turnNum, commitmentType, commitmentCount };
}
