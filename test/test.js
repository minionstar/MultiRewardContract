const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
require("hardhat-gas-reporter");

describe("test QNV token", function () {
  let accounts;
  let rqnvToken;
  let yqnvToken;
  let usdcToken;
  let treasury;
  let owner;
  let user;

  before(async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user = accounts[1];
  });

  beforeEach(async function () {
    //deploy rqnv token
    const rQnvToken = await ethers.getContractFactory("RQNV");
    rqnvToken = await rQnvToken.deploy();
    await rqnvToken.deployed();
    console.log("rQNV token successfully deployed to ", rqnvToken.address);

    //deploy yqnv token
    const yQnvToken = await ethers.getContractFactory("YQNV");
    yqnvToken = await yQnvToken.deploy();
    await yqnvToken.deployed();
    console.log("yQNV token successfully deployed to ", yqnvToken.address);

    //deploy moc usdc token
    const UsdcToken = await ethers.getContractFactory("FiatTokenV2");
    usdcToken = await UsdcToken.deploy();
    await usdcToken.deployed();
    console.log("Moc usdc token successfully deployed to ", usdcToken.address);

    //deploy treasury contract
    const TreasuryContract = await ethers.getContractFactory(
      "QuinvestTreasury"
    );
    treasuryContract = await TreasuryContract.deploy(
      rqnvToken.address,
      yqnvToken.address,
      usdcToken.address
    );
    await treasuryContract.deployed();
    console.log(
      "treasury contract was successfully deployed to ",
      treasuryContract.address
    );

    await usdcToken
      .connect(owner)
      .transfer(treasuryContract.address, ethers.utils.parseEther("100"));
  });

  it("set the treasury as an admin", async function () {
    await rqnvToken.connect(owner).updateAdmin(owner.address);
    expect(await rqnvToken.admin()).to.be.equal(owner.address);

    await yqnvToken.connect(owner).updateAdmin(owner.address);
    expect(await yqnvToken.admin()).to.be.equal(owner.address);
  });

  // it("test stake and claim tokens", async function () {
  //     await rqnvToken.connect(owner).updateAdmin(treasuryContract.address);
  //     expect(await rqnvToken.admin()).to.be.equal(treasuryContract.address);

  //     await yqnvToken.connect(owner).updateAdmin(treasuryContract.address);
  //     expect(await yqnvToken.admin()).to.be.equal(treasuryContract.address);

  //     //send some Moc usdc to user for test
  //     await usdcToken.connect(owner).transfer(user.address, ethers.utils.parseEther("100"));

  //     //approve usdc to the treasury contract.
  //     await usdcToken.connect(user).approve(treasuryContract.address, ethers.utils.parseEther("10"));
  //     expect(await usdcToken.allowance(user.address, treasuryContract.address)).to.be.equal(ethers.utils.parseEther("10"));

  //     const allowedAmount = await usdcToken.allowance(user.address, treasuryContract.address);
  //     console.log("allowed balance : ", allowedAmount);

  //     await treasuryContract.connect(user).stakeToken(allowedAmount, 1);

  //     //check expired time
  //     console.log("staked info:", await treasuryContract.connect(user).getStakedInfo());

  //     //check user's balance of yQNV token
  //     console.log(ethers.utils.formatEther(allowedAmount));
  //     expect(await yqnvToken.balanceOf(user.address)).to.be.equal(parseEther((ethers.utils.formatEther(allowedAmount)).toString()));

  //     //claim test
  //     let offset = 60 * 60 * 24 * 7 + 1;
  //     let stakeinfo = await treasuryContract.connect(user).getStakedInfo();
  //     console.log("start time", stakeinfo['startTS'])
  //     await treasuryContract.connect(user).setStakeInfo(offset);
  //     let stakeInfo = await treasuryContract.connect(user).getStakedInfo();
  //     console.log("start time", stakeInfo['claimedTS'])

  //     // await treasuryContract.connect(user).claimRQNV();
  //     // console.log("after claim", await rqnvToken.balanceOf(user.address))
  //     // await treasuryContract.connect(user).redeemusdc();
  //     // console.log("after redeem", await rqnvToken.balanceOf(user.address))

  //     console.log(await yqnvToken.balanceOf(user.address));

  //     console.log("usdc amount before withdraw",await usdcToken.balanceOf(user.address))
  //     await treasuryContract.connect(user).setStakeInfoEnd(offset);
  //     await treasuryContract.connect(user).withdrawAll();
  //     console.log("usdc amount after withdraw",await usdcToken.balanceOf(user.address))
  // })
});
