// import * as WalletStates from '..';
// import { PreFunding } from '../../../positions';

// describe('WaitForAToDeploy', () => {
//   const walletState = new WalletStates.WaitForAToDeploy(new PreFunding({}));
//   it('is not ready to send', () => {
//     expect(walletState.isReadyToSend).toBe(false);
//   });
//   it('is not funded', () => {
//     expect(walletState.isFunded).toBe(false);
//   });
// });
// describe('ReadyToDeposit', () => {
//   const adjudicator = 'address';
//   const walletState = new WalletStates.ReadyToDeposit(adjudicator);

//   it('returns the address of the adjudicator', () => {
//     expect(walletState.adjudicator).toEqual(adjudicator);
//   });
//   it('is ready to send', () => {
//     expect(walletState.isReadyToSend).toBe(true);
//   });
//   it('is not funded', () => {
//     expect(walletState.isFunded).toBe(false);
//   });
// });
// describe('WaitForBlockchainDeposit', () => {
//   const adjudicator = 'address';
//   const new
//   const walletState = new WalletStates.WaitForBlockchainDeposit(adjudicator);
//   it('returns the address of the adjudicator', () => {
//     expect(walletState.adjudicator).toEqual(adjudicator);
//   });
//   it('is not ready to send', () => {
//     expect(walletState.isReadyToSend).toBe(false);
//   });
//   it('is not funded', () => {
//     expect(walletState.isFunded).toBe(false);
//   });
// });

// describe('Funded', () => {
//   const walletState = new WalletStates.Funded();

// });
