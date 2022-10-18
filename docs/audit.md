# BlackSmith Finance

An isolated risk lending pair implementation.
## Architecture

- Vault

This stores the underlying asset

- LendingPair

This is responsible for performing the lending actions (i.e. deposit, borrow, repay, liquidate).


### Vault

- `deposit`

The user deposit a specific amount of a token into the vault and gets a specific amount of `shares` representing ownership of the tokens.

- `withdraw`

The user can withdraw the underlying token by specifying a specific amount represented in `shares`

- `flashloan`

A `FlashBorrower` contract can `flashloan` assets held in the vault and upon repay `must`
pay the flash loan fee

- `approveContract`

A user can approve / whitelist a contract to withdraw `shares` from their account  

### LendingPair

- `depositBorrowAsset`

The user `must` initially deposit into the vault then whitelist the `LendingPair` they want to use in the vault to enable it to transfer. The user calls `depositBorrowAsset` function on the `LendingPair` after whitelisting the contract on `Vault` and the `LendingPair` transfers from their account to itself and mints them `WrappedBorrowAsset` tokens w.r.t the current exchange rate. The user specifies the amount to deposit in vault `shares` 

- `depositCollateral`

The user `must` initially deposit into the vault then whitelist the `LendingPair` they want to use in the vault to enable it to transfer. The user calls `depositCollateral` function on the `LendingPair` after whitelisting the contract on `Vault` (if the user already whitelisted the contract prior no need to do that anymore) and the `LendingPair` transfers from their account to itself and mints them `WrappedCollateralAsst` tokens in a 1:1 ratio. The user specifies the amount to deposit in vault `shares` 

- `borrow`

The user specifies the amount of borrow tokens. The `borrow` checks if the user
has enough collateral to cover the borrow position and there is enough liquidity in the protocol. It converts the amount being borrowed to vault `shares` then transfers it to the user. The borrow obligation is represented in the amount of borrow token and not `shares`. 

A `debtToken` amount is minted to the user representing the amount of debt owed.

- `repay`

The user specifies the amount of the borrow position they created they want to repay.


- `liquidate`

Enables another user to liquidate an underwater borrow position. 

## Scenarios



