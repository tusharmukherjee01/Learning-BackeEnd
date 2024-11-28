
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiErrorHandel} from "../utils/ApiErrorHandel.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponseHandel} from "../utils/ApiResponseHandel.js"
const registerUser = asyncHandler( async (req,res) => {
    // step:1
    const {fullName,email,username,password}=req.body
    console.log("email : ",email);
    //step:2
   //*****
    if(
        [fullName,email,username,password].some((filed) =>
        filed?.trim() === "")
    ){
        throw new ApiErrorHandel(400,"All Fileds Are Required!!")
    }

    //step:3
   const existedUser =  User.findOne({
        $or:[{ username },{ email }]
     })
   
     if(existedUser){
        throw new ApiErrorHandel(409,"User with email or username Already Exist!!")
     }

    // step:4
  const avatarLocalPath = req.files ?. avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
     throw new ApiErrorHandel(400,"Avatar is Required!!")
  }

  // step : upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath) // and this process will take some this bro use await
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
     throw new ApiErrorHandel(400,"Avatar is Required!!")
  }

  //step:5

 const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url ||"",
    email,
    password,
    username:username.toLowerCase()
  })
  //step:6 and step:7
// read about this select filed => by default everything select you have to unselect this 
   const createdUser = await User.findById(user._id).select(  
    "-password -refreshToken"
   )
    
   if(!createdUser){
    throw new ApiErrorHandel(500,"somthing went wrong while registering the user!!")
   }


   //step:8
   return res.status(200).json(
    new ApiResponseHandel(200,createdUser,"User Registered Successfully!!")
   )
})

export {registerUser}


















/*
Register a User Steps:
1.get user details from frontend(client)
2.validation {checking correct order of data or email format , !empty checking }
3.check if user already exists {check with email or username for unique data}
4.check for images , check for avatar => upload them to cloudinary
5.create a object for store data in mongoDB(nosql) - create entry in DB
6.remove password and refresh token filed from response => i don't wanna send this filed to frontend
7.check for user creatio
8. if created then return response other wise handel error
*/

/*
***** you can check like this also it is valid other also you can do upper syntax
if(fullName === ""){
        throw new ApiErrorHandel(400,"Full Name is Required")
    }

    -> read about this [].some methods if aftre thrim any filed is empty return then that filed is empty in req.body so have to throw error..
*/