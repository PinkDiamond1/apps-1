import * as states from './states';
import {
  ResponderConcludingState as CState,
  ResponderNonTerminalState as NonTerminalCState,
  responderApproveConcluding,
  responderWaitForDefund,
  responderAcknowledgeSuccess,
  responderAcknowledgeFailure,
  responderDecideDefund,
} from './states';
import { unreachable } from '../../../../utils/reducer-utils';
import {
  SharedData,
  getChannel,
  setChannelStore,
  queueMessage,
  checkAndStore,
} from '../../../state';
import { composeConcludeCommitment } from '../../../../utils/commitment-utils';
import { ourTurn } from '../../../channel-store';
import { DefundingAction, isDefundingAction } from '../../defunding/actions';
import { initialize as initializeDefunding, defundingReducer } from '../../defunding/reducer';
import { isSuccess, isFailure } from '../../defunding/states';
import * as selectors from '../../../selectors';
import * as channelStoreReducer from '../../../channel-store/reducer';
import { theirAddress } from '../../../channel-store';
import { sendCommitmentReceived } from '../../../../communication';
import {
  showWallet,
  hideWallet,
  sendConcludeFailure,
  sendConcludeSuccess,
} from '../../reducer-helpers';
import { ProtocolAction } from '../../../../redux/actions';
import { isConcludingAction } from './actions';
import { getChannelId, SignedCommitment } from '../../../../domain';
import { failure, success } from '../state';
import { ProtocolStateWithSharedData } from '../..';

export type ReturnVal = ProtocolStateWithSharedData<states.ResponderConcludingState>;
export type Storage = SharedData;

export function responderConcludingReducer(
  protocolState: NonTerminalCState,
  sharedData: SharedData,
  action: ProtocolAction,
): ReturnVal {
  if (isDefundingAction(action)) {
    return handleDefundingAction(protocolState, sharedData, action);
  }

  if (!isConcludingAction(action)) {
    return { protocolState, sharedData };
  }

  switch (action.type) {
    case 'WALLET.CONCLUDING.RESPONDER.CONCLUDE_APPROVED':
      return concludeApproved(protocolState, sharedData);
    case 'WALLET.CONCLUDING.RESPONDER.DEFUND_CHOSEN':
      return defundChosen(protocolState, sharedData);
    case 'WALLET.CONCLUDING.RESPONDER.ACKNOWLEDGED':
      return acknowledged(protocolState, sharedData);
    default:
      return unreachable(action);
  }
}

export function initialize(
  signedCommitment: SignedCommitment,
  processId: string,
  sharedData: Storage,
): ReturnVal {
  const channelId = getChannelId(signedCommitment.commitment);
  let channelState = getChannel(sharedData, channelId);
  if (!channelState) {
    return {
      protocolState: responderAcknowledgeFailure({
        processId,
        channelId,
        reason: 'ChannelDoesntExist',
      }),
      sharedData: showWallet(sharedData),
    };
  }

  const checkResult = checkAndStore(sharedData, signedCommitment);
  if (!checkResult.isSuccess) {
    throw new Error('Concluding responding protocol, unable to validate or store commitment');
  }
  const updatedStorage = checkResult.store;
  channelState = getChannel(updatedStorage, channelId);
  if (channelState && ourTurn(channelState)) {
    // if it's our turn now, we may resign
    return {
      protocolState: responderApproveConcluding({ channelId, processId }),
      sharedData: showWallet(updatedStorage),
    };
  } else {
    return {
      protocolState: responderAcknowledgeFailure({ channelId, processId, reason: 'NotYourTurn' }),
      sharedData: showWallet(sharedData),
    };
  }
}

function handleDefundingAction(
  protocolState: NonTerminalCState,
  sharedData: Storage,
  action: DefundingAction,
): ReturnVal {
  if (protocolState.type !== 'ResponderWaitForDefund') {
    return { protocolState, sharedData };
  }
  const defundingState1 = protocolState.defundingState;

  const protocolStateWithSharedData = defundingReducer(defundingState1, sharedData, action);
  const updatedDefundingState = protocolStateWithSharedData.protocolState;
  sharedData = protocolStateWithSharedData.sharedData;
  if (isSuccess(updatedDefundingState)) {
    protocolState = responderAcknowledgeSuccess(protocolState);
  } else if (isFailure(updatedDefundingState)) {
    protocolState = responderAcknowledgeFailure({ ...protocolState, reason: 'DefundFailed' });
  } else {
    protocolState = { ...protocolState, defundingState: updatedDefundingState };
  }
  return { protocolState, sharedData };
}

function concludeApproved(protocolState: NonTerminalCState, sharedData: Storage): ReturnVal {
  if (protocolState.type !== 'ResponderApproveConcluding') {
    return { protocolState, sharedData };
  }

  const channelState = getChannel(sharedData, protocolState.channelId);

  if (channelState) {
    const sharedDataWithOwnCommitment = createAndSendConcludeCommitment(
      sharedData,
      protocolState.processId,
      protocolState.channelId,
    );
    return {
      protocolState: responderDecideDefund({ ...protocolState }),
      sharedData: sharedDataWithOwnCommitment,
    };
  } else {
    return { protocolState, sharedData };
  }
}

function defundChosen(protocolState: NonTerminalCState, sharedData: Storage): ReturnVal {
  if (protocolState.type !== 'ResponderDecideDefund') {
    return { protocolState, sharedData };
  }
  // initialize defunding state machine

  const protocolStateWithSharedData = initializeDefunding(
    protocolState.processId,
    protocolState.channelId,
    sharedData,
  );
  const defundingState = protocolStateWithSharedData.protocolState;
  sharedData = protocolStateWithSharedData.sharedData;
  return {
    protocolState: responderWaitForDefund({ ...protocolState, defundingState }),
    sharedData,
  };
}

function acknowledged(protocolState: CState, sharedData: Storage): ReturnVal {
  switch (protocolState.type) {
    case 'ResponderAcknowledgeSuccess':
      return { protocolState: success(), sharedData: sendConcludeSuccess(hideWallet(sharedData)) };
    case 'ResponderAcknowledgeFailure':
      return {
        protocolState: failure({ reason: protocolState.reason }),
        sharedData: sendConcludeFailure(hideWallet(sharedData), 'Other'),
      };
    default:
      return { protocolState, sharedData };
  }
}

//  Helpers
const createAndSendConcludeCommitment = (
  sharedData: SharedData,
  processId: string,
  channelId: string,
): SharedData => {
  const channelState = selectors.getOpenedChannelState(sharedData, channelId);

  const commitment = composeConcludeCommitment(channelState);

  const signResult = channelStoreReducer.signAndStore(sharedData.channelStore, commitment);
  if (signResult.isSuccess) {
    const sharedDataWithOwnCommitment = setChannelStore(sharedData, signResult.store);
    const messageRelay = sendCommitmentReceived(
      theirAddress(channelState),
      processId,
      signResult.signedCommitment.commitment,
      signResult.signedCommitment.signature,
    );
    return queueMessage(sharedDataWithOwnCommitment, messageRelay);
  } else {
    throw new Error(
      `Direct funding protocol, createAndSendPostFundCommitment, unable to sign commitment: ${
        signResult.reason
      }`,
    );
  }
};
