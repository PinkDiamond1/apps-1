import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import * as actions from '../../../redux/actions';
import { WalletProtocol } from '../../../redux/types';
import { unreachable } from '../../../utils/reducer-utils';
import { FundingStep } from './components/funding-step';
import * as directFundingStates from './states';
import { TransactionSubmission } from '../../protocols/transaction-submission/container';

interface Props {
  directFundingState: directFundingStates.DirectFundingState;
  transactionRetryApprovedAction: (channelId: string, protocol: WalletProtocol) => void;
}

class DirectFundingContainer extends PureComponent<Props> {
  render() {
    const { directFundingState } = this.props;
    switch (directFundingState.type) {
      case 'DirectFunding.NotSafeToDeposit':
      case 'DirectFunding.WaitForFundingAndPostFundSetup':
      case 'DirectFunding.FundingSuccess':
        return <FundingStep directFundingState={directFundingState} />;
      case 'DirectFunding.WaitForDepositTransaction':
        return (
          // TODO: how should we populate the transaction name?
          <TransactionSubmission
            state={directFundingState.transactionSubmissionState}
            transactionName={'direct deposit'}
          />
        );
      case 'DirectFunding.FundingFailure':
        // todo: restrict the container to non-terminal states
        return <div>This shouldn't ever get shown.</div>;
      default:
        return unreachable(directFundingState);
    }
  }
}

const mapDispatchToProps = {
  transactionRetryApprovedAction: actions.transactionRetryApproved,
};

// why does it think that mapStateToProps can return undefined??

export default connect(
  () => ({}),
  mapDispatchToProps,
)(DirectFundingContainer);
