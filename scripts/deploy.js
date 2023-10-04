const hre = require("hardhat");
require("@nomiclabs/hardhat-etherscan");

async function main() {

    const rQNVToken = await hre.ethers.getContractFactory("RQNV");
    const rqnvToken = await rQNVToken.deploy();
    await rqnvToken.deployed();

    const yQNVToken = await hre.ethers.getContractFactory("YQNV");
    const yqnvToken = await yQNVToken.deploy();
    await yqnvToken.deployed();

    // const stableAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" // ethereum
    const stableAddress = "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23" //mumbai
    const TreasuryContract = await hre.ethers.getContractFactory("QuinvestTreasury");
    const treasuryContract = await TreasuryContract.deploy(rqnvToken.address, yqnvToken.address, stableAddress);
    await treasuryContract.deployed();

    console.log(rqnvToken.address);
    console.log(yqnvToken.address);
    console.log(treasuryContract);

    await hre.run("verify:verify", {
        address: rqnvToken.address,
        contract: "contracts/rQNV.sol:RQNV",
        constructorArguments: [],
    });

    await hre.run("verify:verify", {
        address: yqnvToken.address,
        contract: "contracts/yQNV.sol:YQNV",
        constructorArguments: [],
    });

    await hre.run("verify:verify", {
        address: treasuryContract.address,
        contract: "contracts/QuinvestTreasury.sol:QuinvestTreasury",
        constructorArguments: [rqnvToken.address, yqnvToken.address, stableAddress],
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});