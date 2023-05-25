import { ethers } from "hardhat";
import "dotenv/config";
import { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } from "../constants";

const main = async () => {
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  const metadataURL = METADATA_URL;
  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  );

  await deployedCryptoDevsContract.deployed();
  console.log("Crypto Devs Contract Address: ", deployedCryptoDevsContract.address);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
