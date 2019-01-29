import { call, put } from "redux-saga/effects";
import { transactionSentToMetamask, transactionSubmitted, transactionConfirmed, transactionFinalized, transactionSubmissionFailed } from "../actions";
import { ethers } from "ethers";
import { getProvider } from "../../utils/contract-utils";
import { TransactionResponse } from 'ethers/providers';

export function* transactionSender(transaction) {

  const provider: ethers.providers.JsonRpcProvider = yield call(getProvider);
  const signer = provider.getSigner();
  yield put(transactionSentToMetamask());
  let transactionResult: TransactionResponse;
  try {
    transactionResult = yield call([signer, signer.sendTransaction], transaction);
  } catch (err) {
    yield put(transactionSubmissionFailed(err));
    return;
  }
  yield put(transactionSubmitted(transactionResult.hash ? transactionResult.hash : ''));
  const confirmedTransaction = yield call([transactionResult, transactionResult.wait]);
  yield put(transactionConfirmed(confirmedTransaction.contractAddress));
  // TODO: Figure out how to wait for a transaction to be X blocks deep
  // yield call(transactionResult.wait, 5);
  yield put(transactionFinalized());



}