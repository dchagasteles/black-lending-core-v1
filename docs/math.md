# Math

## Rounding

Rounding in `Vault` `toShare` & `toUnderlying` a user could end up with a fraction less than what they deposited if the protocol doesn't accrue fees.

#### Vault

We round down in the `deposit` & `withdraw` function of `Vault` which means the user could end up with a fraction less of the value they deposited

#### LendingPair

We address this by rounding up for LendingPair actions such as `liquidation` & `repay` because we don't want users to underpay for a `repay` or `liquidation`

