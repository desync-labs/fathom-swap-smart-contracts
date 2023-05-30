const { advanceBlock } = require('./helpers/time');

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");

describe("Farm", () => {
    beforeEach(async () => {
        const signers = await ethers.getSigners();

        this.dev = signers[0];
        this.alice = signers[1];
        this.bob = signers[2];

        const BEP20 = await ethers.getContractFactory("BEP20");
       
        this.reward = await BEP20.deploy('RewardToken', 'RWD');
        this.lp1 = await BEP20.deploy('LPToken', 'LP1');
        this.lp2 = await BEP20.deploy('LPToken', 'LP2');
        this.lp3 = await BEP20.deploy('LPToken', 'LP2');

        const Farm = await ethers.getContractFactory("Farm");
        this.farm = await Farm.deploy()
        await this.farm.initialize(this.reward.address, '100');

        this.farmAsAlice = this.farm.connect(this.alice);
        this.lp1AsAlice = this.lp1.connect(this.alice);
        this.lp2AsAlice = this.lp2.connect(this.alice);
        this.lp3AsAlice = this.lp3.connect(this.alice);

        await this.reward.mint(this.farm.address, parseEther('2000'))

        await this.lp1.mint(this.bob.address, '2000')
        await this.lp2.mint(this.bob.address, '2000')
        await this.lp3.mint(this.bob.address, '2000')

        await this.lp1.mint(this.alice.address, '2000')
        await this.lp2.mint(this.alice.address, '2000')
        await this.lp3.mint(this.alice.address, '2000')
    });
    it('comlex scenario', async () => {
        await this.farm.addPool(this.lp1.address, '2000');
        await this.farm.addPool(this.lp2.address, '200');
        await this.farm.addPool(this.lp3.address, '1000');

        await this.lp1AsAlice.approve(this.farm.address, '1000');
        await this.lp2AsAlice.approve(this.farm.address, '1000');
        await this.lp3AsAlice.approve(this.farm.address, '1000');

        await this.farmAsAlice.deposit(this.lp1.address, '1000');
        await this.farmAsAlice.deposit(this.lp2.address, '1000');
        await this.farmAsAlice.deposit(this.lp3.address, '1000');

        for (let i = 0; i < 10; i++) {
            await advanceBlock();
        }

        //  const m = 1685365744 - 26
        await this.farm.updatePoolReward(this.lp1.address);
        await this.farm.updatePoolReward(this.lp2.address);
        await this.farm.updatePoolReward(this.lp3.address);

        const pool1 = await this.farm.poolInfos(this.lp1.address);
        const pool2 = await this.farm.poolInfos(this.lp2.address);
        const pool3 = await this.farm.poolInfos(this.lp3.address);

        expect(pool1.accRewardPerShare).to.be.eq('812000000000'); 
        expect(pool2.accRewardPerShare).to.be.eq('81000000000');
        expect(pool3.accRewardPerShare).to.be.eq('406000000000');

        await this.farmAsAlice.withdraw(this.lp1.address, '0'); // 999
        expect(await this.reward.balanceOf(this.alice.address)).to.be.eq('999');
        await this.farmAsAlice.withdraw(this.lp2.address, '0'); // 99
        expect(await this.reward.balanceOf(this.alice.address)).to.be.eq('1098');
        await this.farmAsAlice.withdraw(this.lp3.address, '0'); // 599
        expect(await this.reward.balanceOf(this.alice.address)).to.be.eq('1597');
    })

    it('deposit/withdraw', async () => {
        await this.farm.addPool(this.lp1.address, '1000');

        await this.lp1AsAlice.approve(this.farm.address, '2000');
        await this.farmAsAlice.deposit(this.lp1.address, '2000');

        expect(await this.lp1.balanceOf(this.alice.address)).to.be.eq('0');
        expect(await this.lp1.balanceOf(this.farm.address)).to.be.eq('2000');

        await this.farmAsAlice.withdraw(this.lp1.address, '1000');

        expect(await this.lp1.balanceOf(this.alice.address)).to.be.eq('1000');
        expect(await this.lp1.balanceOf(this.farm.address)).to.be.eq('1000');
    })

    it('emergency withdraw', async () => {
        await this.farm.addPool(this.lp1.address, '1000');

        await this.lp1AsAlice.approve(this.farm.address, '2000');
        await this.farmAsAlice.deposit(this.lp1.address, '2000');

        expect(await this.lp1.balanceOf(this.alice.address)).to.be.eq('0');
        expect(await this.lp1.balanceOf(this.farm.address)).to.be.eq('2000');

        await this.farm.pause();
        await this.farmAsAlice.emergencyWithdraw(this.lp1.address);

        expect(await this.lp1.balanceOf(this.alice.address)).to.be.eq('2000');
        expect(await this.lp1.balanceOf(this.farm.address)).to.be.eq('0');
    })

    it('update allocation', async () => {
        await this.farm.addPool(this.lp1.address, '1000');
       
        let pool = await this.farm.poolInfos(this.lp1.address);
        expect(pool.allocPoint).to.be.eq('1000');

        await this.farm.updateAllocation(this.lp1.address, '2000');

        pool = await this.farm.poolInfos(this.lp1.address);
        expect(pool.allocPoint).to.be.eq('2000');
    })

    it('update rewardPerBlock', async () => {
        expect(await this.farm.rewardPerBlock()).to.be.eq('100');

        await this.farm.setRewardPerBlock('200');

        expect(await this.farm.rewardPerBlock()).to.be.eq('200');
    })

    it('access control', async () => {
        await expect(this.farmAsAlice.addPool(this.lp1.address, '1000')).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(this.farmAsAlice.setRewardPerBlock('0')).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(this.farmAsAlice.pause()).to.be.revertedWith('Ownable: caller is not the owner');
        await expect(this.farmAsAlice.updateAllocation(this.lp1.address, '1')).to.be.revertedWith('Ownable: caller is not the owner');
    })
});