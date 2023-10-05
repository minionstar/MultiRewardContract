// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Justus is ERC20 {
    constructor() ERC20("Justus", "JUT") {
        _mint(_msgSender(), 10 ** 4 * 10 ** 18);
    }
}
