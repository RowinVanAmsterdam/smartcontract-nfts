import path from "path";
import fs from "fs";
import pinataSDK from "@pinata/sdk";

const pinataApiKey = process.env.PINATA_API_KEY!;
const pinataApiSecret = process.env.PINATA_API_SECRET!;
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);

export const storeImages = async (imagesFilePath: string) => {
     const fullImagesPath = path.resolve(imagesFilePath); 
     const files = fs.readdirSync(fullImagesPath);
     let responses = [];
     console.log("Uploading to Pinata!")
     for (const fileIndex in files) {
        console.log("Uploading file: ", files[fileIndex]);
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`);
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile);
            responses.push(response);
        } catch (error) {
            console.log(error);
        }
     }
     return { responses, files };
}

export const storeTokenUriMetadata = async (metadata: any) => {
    try {
        const response = await pinata.pinJSONToIPFS(metadata);
        return response;
    } catch (error) {
        console.log(error);
    }
    return null;
}