import { developmentChains, networkConfig, VERIFICATION_BLOCK_CONFIRMATIONS } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { verify } from "../utils/verify";
import { storeImages, storeTokenUriMetadata } from "../utils/uploadToPinata";
import "dotenv/config";

const imagesLocation = "./images/randomNft";
let tokenUris = ["ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo","ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d","ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm"];

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
};

const deployRandomIpfsNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId!;

    let vrfCoordinatorV2Address;
    let subscriptionId;

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris();
    }

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const tx = await vrfCoordinatorV2Mock.createSubscription();
        const txReceipt = await tx.wait(1);
        subscriptionId = txReceipt.events[0].args.subId;
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }

    const waitBlockConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

    log("----------------------------------------------------");
    console.log("tokenUris", tokenUris);
    const args: any[] = [
        vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ];

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations || 1,
    });
    log("----------------------------------------------------");
    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(randomIpfsNft.address, args);
    }
};

const handleTokenUris = async () => {
    const tokenUris: any[] = [];
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation);
    for (const imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate };
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "");
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name}!`;
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
        console.log(`Uploading ${tokenUriMetadata.name}...`);
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata);
        tokenUris.push(`ipfs://${metadataUploadResponse!.IpfsHash}`);
    }
    console.log("Token URIs Uploaded! They are:");
    console.log(tokenUris);
    return tokenUris;
};

export default deployRandomIpfsNft;
deployRandomIpfsNft.tags = ["all", "randomipfs", "main"];
