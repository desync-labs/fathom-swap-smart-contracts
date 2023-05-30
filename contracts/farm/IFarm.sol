// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IFarm {
    function addPool(address _lpToken, uint _allocPoint) external;

    function updateAllocation(address _lpToken, uint _allocPoint) external;

    function deposit(address _lpToken, uint256 _amount) external;

    function withdraw(address _lpToken, uint256 _amount) external;

    function emergencyWithdraw(address _lpToken) external;

    function setRewardPerBlock(uint256 _rewardPerBlock) external;

    function pause() external;

    function updatePoolReward(address _lpToken) external;

    function rewardPerBlock() external view returns (uint);

    function totalAllocPoint() external view returns (uint);

    function rewardToken() external view returns (address);
}
