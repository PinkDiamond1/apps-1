import React from 'react';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import * as actions from './actions';
import * as states from './states';

import { unreachable } from '../../../../utils/reducer-utils';
import { TwoPartyPlayerIndex } from '../../../types';
import { FundingStrategy } from '..';
import ChooseStrategy from '../../../../components/funding/choose-strategy';
import WaitForOtherPlayer from '../../../../components/wait-for-other-player';
import AcknowledgeX from '../../../../components/acknowledge-x';
import { IndirectFunding } from '../../new-ledger-funding/container';
import { ActionDispatcher } from '../../../utils';
import { isNewLedgerFundingState } from '../../new-ledger-funding/states';
import { ExistingChannelFunding } from '../../existing-ledger-funding/container';

interface Props {
  state: states.OngoingFundingState;
  strategyChosen: ActionDispatcher<actions.StrategyChosen>;
  strategyApproved: typeof actions.strategyApproved;
  strategyRejected: ActionDispatcher<actions.StrategyRejected>;
  fundingSuccessAcknowledged: ActionDispatcher<actions.FundingSuccessAcknowledged>;
  cancelled: ActionDispatcher<actions.Cancelled>;
}

class FundingContainer extends PureComponent<Props> {
  render() {
    const { state, strategyChosen, cancelled, fundingSuccessAcknowledged } = this.props;
    const { processId } = state;

    switch (state.type) {
      case 'Funding.PlayerA.WaitForStrategyChoice':
        return (
          <ChooseStrategy
            strategyChosen={(strategy: FundingStrategy) => strategyChosen({ processId, strategy })}
            cancelled={() => cancelled({ processId, by: TwoPartyPlayerIndex.B })}
          />
        );
      case 'Funding.PlayerA.WaitForStrategyResponse':
        return <WaitForOtherPlayer name={'strategy response'} />;
      case 'Funding.PlayerA.WaitForFunding':
        if (isNewLedgerFundingState(state.fundingState)) {
          return <IndirectFunding state={state.fundingState} />;
        } else {
          return <ExistingChannelFunding state={state.fundingState} />;
        }
      case 'Funding.PlayerA.WaitForSuccessConfirmation':
        return (
          <AcknowledgeX
            title="Channel funded!"
            action={() => fundingSuccessAcknowledged({ processId })}
            description="You have successfully funded your channel"
            actionTitle="Ok!"
          />
        );
      default:
        return unreachable(state);
    }
  }
}

const mapDispatchToProps = {
  strategyChosen: actions.strategyChosen,
  strategyApproved: actions.strategyApproved,
  strategyRejected: actions.strategyRejected,
  fundingSuccessAcknowledged: actions.fundingSuccessAcknowledged,
  cancelled: actions.cancelled,
};

export const Funding = connect(
  () => ({}),
  mapDispatchToProps,
)(FundingContainer);
