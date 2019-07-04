import * as states from './states';
import { SharedData, getPrivatekey } from '../../state';
import { ProtocolStateWithSharedData, ProtocolReducer } from '..';
import { WalletAction, advanceChannel } from '../../actions';
import { isVirtualFundingAction } from './actions';
import { unreachable } from '../../../utils/reducer-utils';
import { CommitmentType } from '../../../domain';
import { bytesFromAppAttributes } from 'fmg-nitro-adjudicator/lib/consensus-app';
import { CONSENSUS_LIBRARY_ADDRESS } from '../../../constants';
import { advanceChannelReducer } from '../advance-channel';

type ReturnVal = ProtocolStateWithSharedData<states.VirtualFundingState>;

interface InitializationArgs {
  ourIndex: number;
  targetChannelId: string;
  processId: string;
  startingAllocation: string[];
  startingDestination: string[];
}

export function initialize(sharedData: SharedData, args: InitializationArgs): ReturnVal {
  const { ourIndex, processId, targetChannelId, startingAllocation, startingDestination } = args;
  const privateKey = getPrivatekey(sharedData, targetChannelId);
  const channelType = CONSENSUS_LIBRARY_ADDRESS;

  const initializationArgs = {
    privateKey,
    channelType,
    ourIndex,
    commitmentType: CommitmentType.PreFundSetup,
    clearedToSend: true,
    processId,
    protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR,
  };

  const jointChannelInitialized = advanceChannel.initializeAdvanceChannel(
    processId,
    sharedData,
    CommitmentType.PreFundSetup,
    { ...initializationArgs, ...channelSpecificArgs(startingAllocation, startingDestination) },
  );

  return {
    protocolState: states.waitForJointChannel({
      processId,
      [states.JOINT_CHANNEL_DESCRIPTOR]: jointChannelInitialized.protocolState,
      targetChannelId,
      startingAllocation,
      startingDestination,
    }),
    sharedData: jointChannelInitialized.sharedData,
  };
}

export const reducer: ProtocolReducer<states.VirtualFundingState> = (
  protocolState: states.NonTerminalVirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) => {
  if (!isVirtualFundingAction(action)) {
    console.error('Invalid action: expected WALLET.COMMON.COMMITMENTS_RECEIVED');
    return { protocolState, sharedData };
  }

  switch (protocolState.type) {
    case 'VirtualFunding.WaitForJointChannel': {
      return waitForJointChannelReducer(protocolState, sharedData, action);
    }
    case 'VirtualFunding.WaitForGuarantorChannel': {
      return waitForGuarantorChannelReducer(protocolState, sharedData, action);
    }
    case 'VirtualFunding.WaitForGuarantorFunding': {
      return waitForGuarantorFundingReducer(protocolState, sharedData, action);
    }
    case 'VirtualFunding.WaitForApplicationFunding': {
      return waitForApplicationFundingReducer(protocolState, sharedData, action);
    }
    default:
      return unreachable(protocolState);
  }
};

function waitForJointChannelReducer(
  protocolState: states.WaitForJointChannel,
  sharedData: SharedData,
  action: WalletAction,
) {
  const { processId } = protocolState;
  if (
    action.type === 'WALLET.COMMON.COMMITMENTS_RECEIVED' &&
    action.protocolLocator === states.JOINT_CHANNEL_DESCRIPTOR
  ) {
    const result = advanceChannelReducer(
      protocolState[states.JOINT_CHANNEL_DESCRIPTOR],
      sharedData,
      action,
    );

    if (advanceChannel.isSuccess(result.protocolState)) {
      const { ourIndex, channelId } = result.protocolState;
      switch (result.protocolState.commitmentType) {
        case CommitmentType.PreFundSetup:
          const jointChannelResult = advanceChannel.initializeAdvanceChannel(
            processId,
            result.sharedData,
            CommitmentType.PostFundSetup,
            {
              clearedToSend: true,
              commitmentType: CommitmentType.PostFundSetup,
              processId,
              protocolLocator: states.JOINT_CHANNEL_DESCRIPTOR,
              channelId,
              ourIndex,
            },
          );

          return {
            protocolState: {
              ...protocolState,
              [states.JOINT_CHANNEL_DESCRIPTOR]: jointChannelResult.protocolState,
            },
            sharedData: jointChannelResult.sharedData,
          };
        case CommitmentType.PostFundSetup:
          const { targetChannelId } = protocolState;
          const privateKey = getPrivatekey(sharedData, targetChannelId);
          const channelType = CONSENSUS_LIBRARY_ADDRESS;
          const allocation = [channelId, 'HUB_ADDRESS']; // TODO: Replace with proper address
          const guarantorChannelResult = advanceChannel.initializeAdvanceChannel(
            processId,
            result.sharedData,
            CommitmentType.PostFundSetup,
            {
              clearedToSend: true,
              commitmentType: CommitmentType.PreFundSetup,
              processId,
              protocolLocator: states.GUARANTOR_CHANNEL_DESCRIPTOR,
              ourIndex,
              privateKey,
              channelType,
              ...channelSpecificArgs(allocation, []),
            },
          );
          return {
            protocolState: {
              ...protocolState,
              [states.GUARANTOR_CHANNEL_DESCRIPTOR]: guarantorChannelResult.protocolState,
            },
            sharedData: guarantorChannelResult.sharedData,
          };
        case CommitmentType.App:
        case CommitmentType.Conclude:
          throw new Error('Unimplemented');
      }
    }
  }
  return { protocolState, sharedData };
}

function waitForGuarantorChannelReducer(
  protocolState: states.VirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) {
  // Unimplemented
  return { protocolState, sharedData };
}

function waitForGuarantorFundingReducer(
  protocolState: states.VirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) {
  // Unimplemented
  return { protocolState, sharedData };
}

function waitForApplicationFundingReducer(
  protocolState: states.VirtualFundingState,
  sharedData: SharedData,
  action: WalletAction,
) {
  // Unimplemented
  return { protocolState, sharedData };
}

function channelSpecificArgs(
  allocation: string[],
  destination: string[],
): { allocation: string[]; destination: string[]; appAttributes: string } {
  return {
    allocation,
    destination,
    appAttributes: bytesFromAppAttributes({
      proposedAllocation: allocation,
      proposedDestination: destination,
      furtherVotesRequired: 0,
    }),
  };
}
