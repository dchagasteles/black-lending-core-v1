// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20("Mock", "MCT") {
    uint8 _decimals;

    constructor(uint8 __decimals) {
        _decimals = __decimals;
    }

    function setBalanceTo(address to, uint256 value) public {
        _mint(to, value);
    }

    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external {
        _burn(_from, _amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
