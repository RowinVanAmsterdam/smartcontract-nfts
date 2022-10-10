import { developmentChains, networkConfig, VERIFICATION_BLOCK_CONFIRMATIONS } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { verify } from "../utils/verify";
import fs from "fs";

const deployDynamicSvgNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const waitBlockConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

    const chainId = network.config.chainId!;
    let usdPriceFeedAddress;

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await ethers.getContract("MockV3Aggregator");
        usdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        usdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
    }

    log("----------------------------------------------------"); 
    const lowSVG = await fs.readFileSync("./images/dynamicNFT/frown.svg", { encoding: "utf8" });
    const highSVG = await fs.readFileSync("./images/dynamicNFT/happy.svg", { encoding: "utf8" });
    const args = [usdPriceFeedAddress, lowSVG, highSVG];
    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations || 1,
    });

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(dynamicSvgNft.address, args);
    }
};

export default deployDynamicSvgNft
deployDynamicSvgNft.tags = ["all", "dynamicsvg", "main"]
