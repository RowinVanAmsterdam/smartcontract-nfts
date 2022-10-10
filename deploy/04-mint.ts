import { developmentChains, networkConfig, VERIFICATION_BLOCK_CONFIRMATIONS } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { verify } from "../utils/verify";
import fs from "fs";

const mint: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const waitBlockConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;
    const chainId = network.config.chainId!;

    // Basic NFT
    const basicNft = await ethers.getContract("BasicNft", deployer);
    const basicMintTx = await basicNft.mintNft();
    await basicMintTx.wait(1);
    console.log(`Basic NFT index 0 has tokenURI: ", ${await basicNft.tokenURI(0)}`);

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
    const mintFee = await randomIpfsNft.getMintFee();

    await new Promise<void>(async (resolve) => {
        setTimeout(resolve, 300000); // 5 minute timeout time
        randomIpfsNft.once("NftMinted", async () => {
            resolve();
        });

        const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() });
        const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1);

        if (chainId == 31337) {
            const requestId = randomIpfsNftMintTxReceipt.events[1].args.requestId.toString();
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address);
        }
    });
    console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`);

    // Dynamic SVG  NFT
    const highValue = ethers.utils.parseEther("4000");
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer);
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue);
    await dynamicSvgNftMintTx.wait(1);
    console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`);
};

export default mint;
mint.tags = ["all", "mint"];
