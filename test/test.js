const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers, network } = require("hardhat");
require("hardhat-gas-reporter");
require("dotenv").config();
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("test mulit-reward contract", function () {
  let accounts;
  let owner;
  let usdcWhale;
  let usdtWhale;
  let stakingContract;
  let justusToken;
  let usdc;
  let usdt;

  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

  const USDC_WHALE = "0xf3b95431443B33784A6e91ea05De98f477122936";
  const USDT_WHALE = "0x0162Cd2BA40E23378Bf0FD41f919E1be075f025F";

  before(async function () {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDC_WHALE],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDT_WHALE],
    });
    accounts = await ethers.getSigners();
    owner = accounts[0];
    stakerOne = accounts[1];
    stakerTwo = accounts[2];

    const StakingToken = await ethers.getContractFactory("Justus");
    justusToken = await StakingToken.deploy();
    await justusToken.deployed();
    console.log(
      "Staking token contract was successfully deployed to ",
      justusToken.address
    );

    // deploy staking contract
    const StakingContract = await ethers.getContractFactory("JustusStake");
    stakingContract = await StakingContract.deploy(justusToken.address);
    await stakingContract.deployed();
    console.log(
      "Staking contract was successfully deployed to ",
      stakingContract.address
    );

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDC_WHALE],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDT_WHALE],
    });

    usdcWhale = await ethers.getSigner(USDC_WHALE);
    usdtWhale = await ethers.getSigner(USDT_WHALE);
    usdc = await ethers.getContractAt("IERC20", USDC);
    usdt = await ethers.getContractAt("IERC20", USDT);

    // send ETH to the distributors
    await owner.sendTransaction({
      to: USDC_WHALE,
      value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
    });

    await owner.sendTransaction({
      to: USDT_WHALE,
      value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
    });
  });

  beforeEach(async function () {
    // deploy staking token contract
  });

  // it("ether value check", async function () {
  //   console.log("owner ETH balance: ", await usdcWhale.getBalance());
  // });

  it("get the whales and deploy contracts", async function () {
    let usdcWhaleBal = await usdc.balanceOf(USDC_WHALE);
    let usdtWhaleBal = await usdt.balanceOf(USDT_WHALE);
    console.log(
      "usdc whale value: ",
      ethers.utils.formatUnits(usdcWhaleBal, 6)
    );
    console.log(
      "usdt whale value: ",
      ethers.utils.formatUnits(usdtWhaleBal, 6)
    );

    let justusVal = await justusToken.balanceOf(owner.address);
    console.log(
      "Owner Justus token balance",
      ethers.utils.formatEther(justusVal)
    );
  });

  it("test add reward", async function () {
    const rewardAmount = ethers.utils.parseUnits("1000", 6);
    const stakeAmount = ethers.utils.parseEther("10000");
    const stakePeriod = 100; // 100s

    // record reward token (USDC), period, distributor

    await justusToken
      .connect(owner)
      .approve(stakingContract.address, stakeAmount);
    await stakingContract.connect(owner).stake(stakeAmount);
    expect(await justusToken.balanceOf(stakingContract.address)).to.be.equal(
      stakeAmount
    );

    await stakingContract
      .connect(owner)
      .addReward(USDC, USDC_WHALE, stakePeriod);

    // owner stake justus token

    console.log(
      "owner staked Justus token. Amount : ",
      ethers.utils.formatEther(
        await justusToken.balanceOf(stakingContract.address)
      )
    );

    // USDC whale is a distrubutor and notify reward
    await usdc
      .connect(usdcWhale)
      .approve(stakingContract.address, rewardAmount);
    await stakingContract
      .connect(owner)
      .setRewardsDistributor(USDC, USDC_WHALE);
    await stakingContract
      .connect(usdcWhale)
      .notifyRewardAmount(USDC, rewardAmount);
    expect(await usdc.balanceOf(stakingContract.address)).to.be.equal(
      rewardAmount
    );

    console.log(
      "USDC reward token added. Amount: ",
      ethers.utils.formatUnits(await usdc.balanceOf(stakingContract.address), 6)
    );

    // record reward token (USDT), period, distributor
    await stakingContract
      .connect(owner)
      .addReward(USDT, USDT_WHALE, stakePeriod);

    // USDC whale is a distrubutor and notify reward
    await usdt
      .connect(usdtWhale)
      .approve(stakingContract.address, rewardAmount);
    await stakingContract
      .connect(owner)
      .setRewardsDistributor(USDT, USDT_WHALE);
    await stakingContract
      .connect(usdtWhale)
      .notifyRewardAmount(USDT, rewardAmount);
    expect(await usdt.balanceOf(stakingContract.address)).to.be.equal(
      rewardAmount
    );

    console.log(
      "USDT reward token added. Amount: ",
      ethers.utils.formatUnits(await usdt.balanceOf(stakingContract.address), 6)
    );

    // check total supply
    expect(await stakingContract.connect(owner).totalSupply()).to.be.equal(
      stakeAmount
    );
    console.log("current timestamp: ", await time.latest());
    await mine(10000); //10s passed
    console.log("current timestamp: ", await time.latest());
    console.log(
      "Total supply is : ",
      ethers.utils.formatEther(
        await stakingContract.connect(owner).totalSupply()
      )
    );

    //check reward per token calculations is correct

    const rewardData = await stakingContract.rewardData(USDC);
    const rewardPerTokenStored = rewardData["rewardPerTokenStored"];
    console.log("reward per token stored: ", rewardPerTokenStored);

    const rewardRate = parseInt(rewardAmount / stakePeriod);
    let time_max = await stakingContract
      .connect(owner)
      .lastTimeRewardApplicable(USDC);
    let time_min = rewardData["lastUpdateTime"];
    let interval = time_max - time_min;
    console.log(
      "time max",
      time_max,
      " || time min",
      time_min,
      " || interval: ",
      interval
    );

    const rpt_calc = parseInt((interval * 10 ** 18 * rewardRate) / stakeAmount);
    const rpt = await stakingContract.connect(owner).rewardPerToken(USDC);

    console.log("rpt_calculate: ", rpt_calc);
    console.log("rpt: ", rpt);

    expect(rewardPerTokenStored.add(rpt_calc)).to.be.equal(rpt);

    // check earning calculation is correct
    const calc_earnings = stakeAmount
      .mul(rpt)
      .div(ethers.BigNumber.from("1000000000000000000"));
    const act_earnings = await stakingContract.earned(owner.address, USDC);
    expect(calc_earnings).to.be.equal(act_earnings);

    const reward_duration = await stakingContract.getRewardForDuration(USDC);
    expect(reward_duration).to.be.equal(act_earnings);

    // test exit
    await stakingContract.connect(owner).exit();
    expect(await justusToken.balanceOf(stakingContract.address)).to.be.equal(0);
  });
});

// test script
//npx hardhat --network localhost test
