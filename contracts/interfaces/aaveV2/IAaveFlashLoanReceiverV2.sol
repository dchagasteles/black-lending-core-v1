// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {IAaveLendingPoolAddressesProviderV2} from "./IAaveLendingPoolAddressesProviderV2.sol";
import {IAaveLendingPoolV2} from "./IAaveLendingPoolV2.sol";

/**
 * @title IAaveFlashLoanReceiverV2 interface
 * @notice Interface for the Aave fee IFlashLoanReceiver.
 * @author Aave
 * @dev implement this interface to develop a flashloan-compatible flashLoanReceiver contract
 **/
interface IAaveFlashLoanReceiverV2 {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);

    function ADDRESSES_PROVIDER() external view returns (IAaveLendingPoolAddressesProviderV2);

    function LENDING_POOL() external view returns (IAaveLendingPoolV2);
}
