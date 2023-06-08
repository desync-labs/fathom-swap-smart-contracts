// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./libraries/SafeToken.sol";
import "./IFarm.sol";
import "../core/interfaces/IERC20.sol";

contract Farm is IFarm, OwnableUpgradeable, PausableUpgradeable {
    using SafeToken for address;

    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    struct PoolInfo {
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accRewardPerShare;
    }

    address public rewardToken;

    uint256 public rewardPerBlock;
    uint256 public totalAllocPoint = 0;

    mapping(address => PoolInfo) public poolInfos;
    mapping(address => mapping(address => StakeInfo)) public stakes;
    mapping(address => uint256) private lpTokenBalances;

    event LogPoolAdded(address indexed lpToken, uint256 allocPoint);
    event LogPoolAllocationUpdate(address indexed lpToken, uint256 allocPoint);
    event LogPoolRewardUpdate(
        address indexed lpToken,
        uint256 accRewardPerShare,
        uint256 lastRewardBlock
    );
    event LogDeposit(address indexed user, address indexed lpToken, uint256 amount);
    event LogWithdraw(address indexed user, address indexed lpToken, uint256 amount);
    event LogRewardPaid(address indexed user, address indexed lpToken, uint256 reward);

    function initialize(
        address _rewardToken,
        uint256 _rewardPerBlock
    ) external initializer {
        OwnableUpgradeable.__Ownable_init();
        PausableUpgradeable.__Pausable_init();

        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
    }

    function addPool(
        address _lpToken,
        uint256 _allocPoint
    ) external override onlyOwner whenNotPaused {
        poolInfos[_lpToken] = PoolInfo({
            allocPoint: _allocPoint,
            lastRewardBlock: block.number,
            accRewardPerShare: 0
        });

        totalAllocPoint += _allocPoint;

        emit LogPoolAdded(_lpToken, _allocPoint);
    }

    function updateAllocation(
        address _lpToken,
        uint256 _allocPoint
    ) external override onlyOwner whenNotPaused {
        PoolInfo storage pool = poolInfos[_lpToken];

        totalAllocPoint = totalAllocPoint + _allocPoint - pool.allocPoint;
        pool.allocPoint = _allocPoint;

        emit LogPoolAllocationUpdate(_lpToken, _allocPoint);
    }

    function deposit(address _lpToken, uint256 _amount) external override whenNotPaused {
        require(_lpToken != address(0), "Zero address");
        require(_amount > 0, "Zero amount");

        updatePoolReward(_lpToken);

        PoolInfo storage pool = poolInfos[_lpToken];
        StakeInfo storage stake = stakes[_lpToken][msg.sender];

        if (stake.amount > 0) {
            uint256 pending = (stake.amount * pool.accRewardPerShare) /
                1e12 -
                stake.rewardDebt;
            if (pending > 0) {
                address(rewardToken).safeTransfer(msg.sender, pending);
                emit LogRewardPaid(msg.sender, _lpToken, pending);
            }
        }

        stake.amount += _amount;
        stake.rewardDebt = (stake.amount * pool.accRewardPerShare) / 1e12;

        _lpToken.safeTransferFrom(msg.sender, address(this), _amount);
        lpTokenBalances[_lpToken] += _amount;

        emit LogDeposit(msg.sender, _lpToken, _amount);
    }

    function withdraw(
        address _lpToken,
        uint256 _amount
    ) external override whenNotPaused {
        require(_lpToken != address(0), "Zero address");
        PoolInfo storage pool = poolInfos[_lpToken];
        StakeInfo storage stake = stakes[_lpToken][msg.sender];

        require(stake.amount >= _amount, "Not sufficient amount");

        updatePoolReward(_lpToken);

        uint256 pending = (stake.amount * pool.accRewardPerShare) /
            1e12 -
            stake.rewardDebt;
        if (pending > 0) {
            address(rewardToken).safeTransfer(msg.sender, pending);
            emit LogRewardPaid(msg.sender, _lpToken, pending);
        }

        if (_amount > 0) {
            stake.amount -= _amount;
            _lpToken.safeTransfer(msg.sender, _amount);
            lpTokenBalances[_lpToken] -= _amount;
        }

        stake.rewardDebt = (stake.amount * pool.accRewardPerShare) / 1e12;

        emit LogWithdraw(msg.sender, _lpToken, _amount);
    }

    function emergencyWithdraw(address _lpToken) override external whenPaused {
        StakeInfo storage stake = stakes[_lpToken][msg.sender];
        require(stake.amount > 0, "Zero balance");

        uint256 amount = stake.amount;

        stake.amount = 0;
        stake.rewardDebt = 0;

        _lpToken.safeTransfer(msg.sender, amount);
        lpTokenBalances[_lpToken] -= amount;

        emit LogWithdraw(msg.sender,  _lpToken, amount);
    }

    function setRewardPerBlock(uint256 _rewardPerBlock) override external onlyOwner whenNotPaused {
        rewardPerBlock = _rewardPerBlock;
    }

    function pause() external override onlyOwner {
        _pause();
    }


    function unpause() external override onlyOwner {
        _unpause();
    }


    function updatePoolReward(address _lpToken) public override {
        PoolInfo storage pool = poolInfos[_lpToken];

        if (block.number <= pool.lastRewardBlock) {
            return;
        }

        uint256 lpSupply = lpTokenBalances[_lpToken];

        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        uint256 multiplier = block.number - pool.lastRewardBlock;
        uint256 reward = (multiplier * rewardPerBlock * pool.allocPoint) / totalAllocPoint;
        pool.accRewardPerShare += (reward * 1e12) / lpSupply;
        pool.lastRewardBlock = block.number;

        emit LogPoolRewardUpdate(
            _lpToken,
            pool.accRewardPerShare,
            pool.lastRewardBlock
        );
    }
}
