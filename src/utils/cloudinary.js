
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs' // it is comes automatic with nodejs to handel file

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET  // Click 'View API Keys' above to copy your API secret->in cloudinary
    });
    const uploadOnCloudinary = async (localFilePath) =>{
        try{
            if(!localFilePath) return null
            //upload the file on cloudinary
        const response =  await cloudinary.uploader.upload(localFilePath,{
               resourse_type:"auto" 
            })
               //file has been successfuly uploaded..
              console.log("File uploaded on cloudinary :",response)
               fs.unlinkSync(localFilePath)
               return response
        }catch(error){

            fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
             return null;
        }
    }
    export {uploadOnCloudinary}