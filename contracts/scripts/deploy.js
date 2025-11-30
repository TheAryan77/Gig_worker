const hre = require("hardhat");

async function main() {
    const escrow = await hre.ethers.deployContract("Escrow");
    await escrow.waitForDeployment();
    console.log(`Escrow deployed to ${escrow.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
