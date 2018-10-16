import React from 'react';
import { PureComponent } from 'react';

import { ChallengeStatus } from '../domain/ChallengeStatus';
import * as playerA from '../wallet-engine/wallet-states/PlayerA';
import * as playerB from '../wallet-engine/wallet-states/PlayerB';
import { FundingFailed, WaitForApproval, SelectWithdrawalAddress, WaitForWithdrawal, ChallengeRequested, WaitForChallengeConcludeOrExpire } from '../wallet-engine/wallet-states';
import { WalletState } from '../redux/reducers/wallet-state';
import { ChallengeState } from '../redux/reducers/challenge';

import WalletLayout from './WalletLayout';
import FundingInProgress from './FundingInProgress';
import FundingError from './FundingError';
import ConfirmFunding from './ConfirmFunding';
import WithdrawFunds from './WithdrawFunds';
import ChallengeIssued from './ChallengeIssued';
import ChallengeResponse from './ChallengeResponse';
import WaitingForCreateChallenge from './WaitingForCreateChallenge';
import WaitingForConcludeChallenge from './WaitingForConcludeChallenge';

interface Props {
  walletState: WalletState;
  challengeState: ChallengeState;
  tryFundingAgain: () => void;
  approveFunding: () => void;
  declineFunding: () => void;
  selectWithdrawalAddress: (address: string) => void;
  selectMoveResponse: ()=>void;
}

export default class WalletController extends PureComponent<Props> {
  renderWallet() {
    const { walletState, challengeState } = this.props;
    if (walletState === null) {
      return null;
    }

    if (challengeState !== null) {
      switch (challengeState.status){
        case ChallengeStatus.WaitingForUserSelection:
          return (<ChallengeResponse expiryTime={challengeState.expirationTime} responseOptions={challengeState.responseOptions} selectMoveResponse={this.props.selectMoveResponse} />);
        case ChallengeStatus.WaitingOnOtherPlayer:
          return (<ChallengeIssued expiryTime={challengeState.expirationTime}/>);
        case ChallengeStatus.WaitingForCreateChallenge:
          return <WaitingForCreateChallenge />;
        case ChallengeStatus.WaitingForCreateChallenge:
          return <WaitingForCreateChallenge />;
        case ChallengeStatus.WaitingForConcludeChallenge:
          return <WaitingForConcludeChallenge />;
      }
    }

    switch (walletState && walletState.constructor) {
      case FundingFailed:
        return (
          <FundingError
            message={(walletState as FundingFailed).message}
            tryAgain={this.props.tryFundingAgain}
          />
        );
      case WaitForWithdrawal:
      return <div>Waiting for withdrawal process to complete.</div>;
      break;
      case SelectWithdrawalAddress:
        return <WithdrawFunds selectAddress={this.props.selectWithdrawalAddress} />;
        break;
      case ChallengeRequested:
        return <div>Waiting for challenge</div>;
      case WaitForChallengeConcludeOrExpire:
        return <div>Waiting for opponent to respond to challenge</div>;
      case playerA.WaitForBlockchainDeploy:
        return <FundingInProgress message="confirmation of adjudicator deployment" />;

      case playerA.WaitForBToDeposit:
        return <FundingInProgress message="confirmation of adjudicator deployment" />;

      case playerB.WaitForAToDeploy:
        return <FundingInProgress message="waiting for adjudicator to be deployed" />;

      case playerB.ReadyToDeposit:
        return <FundingInProgress message="ready to deposit funds" />;

      case playerB.WaitForBlockchainDeposit:
        return <FundingInProgress message="waiting for deposit confirmation" />;
      case WaitForApproval:
      case playerB.WaitForApprovalWithAdjudicator:
        const {
          myAddress,
          opponentAddress,
          myBalance,
          opponentBalance,
        } = walletState as WaitForApproval;
        const confirmFundingProps = {
          myAddress,
          opponentAddress,
          myBalance,
          opponentBalance,
          rulesAddress: '0x0123',
          appName: 'Rock Paper Scissors',
          approve: this.props.approveFunding,
          decline: this.props.declineFunding,
        };
        return <ConfirmFunding {...confirmFundingProps} />;
      default:
        return (
          <FundingInProgress message={`[view not implemented: ${walletState.constructor.name}`} />
        );
    }
  }

  render() {
    return <WalletLayout>{this.renderWallet()}</WalletLayout>;
  }
}
