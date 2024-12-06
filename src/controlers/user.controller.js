
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiErrorHandel} from "../utils/ApiErrorHandel.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponseHandel} from "../utils/ApiResponseHandel.js"
import jwt from "jsonwebtoken"

// creating access and refresh token

const generateAccessAndRefreshTokens = async (userId) => {

   try{
    const user = await User.findById(userId)
   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()
   user.refreshToken = refreshToken
   await user.save({validateBeforeSave:false})
   return {accessToken,refreshToken}
   }catch(error){
    throw new ApiErrorHandel(500,"Something Went Wrong While Creating Access And Refresh Tokens")
   }
}


const registerUser = asyncHandler( async (req,res) => {
    // step:1
    const {fullName,email,username,password}=req.body
   //  console.log("body : ",req.body);
    //step:2
   //*****
    if(
        [fullName,email,username,password].some((filed) =>
        filed?.trim() === "")
    ){
        throw new ApiErrorHandel(400,"All Fileds Are Required!!")
    }

    //step:3
   const existedUser = await User.findOne({
        $or:[{ username },{ email }]
     })
   
     if(existedUser){
        throw new ApiErrorHandel(409,"User with email or username Already Exist!!")
     }
   //   console.log("Files : ",req.files);
    // step:4
  const avatarLocalPath = req.files ?. avatar[0]?.path;
//   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path
   }


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

//-------------------------------------------------------------------------------------
// LOGIN USER--->--->

const loginUser = asyncHandler(async (req,res) => {
 
   //step:1
   const {email,password,username} = req.body;
    //step:2
   if(!(username || email)){
      throw new ApiErrorHandel(400,"Username or Password is Required")
   }
   //step:3
  const user = await User.findOne({
      $or:[{username},{email}]
   })
    
   if(!user){
      throw new ApiErrorHandel(404,"User does't exist")
   }

   //step:4
  const isPasswordValid = await user.isPasswordCorrect(password)     // here do not use "User" this user is mongodb object so only can access findone,create one like methos which mongodb provide by default ,,, can't access your created method
//step:5
  if(!isPasswordValid){
   throw new ApiErrorHandel(401,"Password does't match")
  }
  
        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

        //step:6
     const loggedInUser =  await User.findById(user._id).
     select("-password -refreshToken")

     const options = {
      httpOnly:true,
      secure:true,
     }

     return res.
     status(200).
     cookie("accessToken",accessToken,options).
     cookie("refreshToken",refreshToken,options).
     json(
      new ApiResponseHandel(
         200,
         {
            user:loggedInUser,accessToken,refreshToken
         },
         "User Logged In Successfully!!"
      )
     )
})
//-------------------------------------------------------------------------------------
//LOGOUT

const logoutUser = asyncHandler (async (req,res) => {
    
  await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
      httpOnly:true,
      secure:true,
     }

     return res.
     status(200).
     clearCookie("accessToken",options).
     clearCookie("refreshToken",options).
     json(new ApiResponseHandel(200,{},"User Logged Out!!"))
})

//-------------------------------------------------------------------------------------
const refreshAccessToken = asyncHandler(async(req,res) => {

  const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incommingRefreshToken){
   throw new ApiErrorHandel(401,"Unauthorizes Request")
  }


   try{
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    )

   const user = await User.findById(decodedToken?._id)

   if(!user){
   throw new ApiErrorHandel(401,"Invalid Refresh Token!!")
  }
    
  if(incommingRefreshToken !== user.refreshToken){

   throw new ApiErrorHandel(401,"Refresh Token is Expired or  Used!!")
  }

  const options = {
   httpOnly:true,
   secure:true
  }

   const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

 res.status(200).
 cookie("accessToken",accessToken,options).
 cookie("refreshToken",newRefreshToken,options).
 json(
   new ApiResponseHandel(200,
      {
         accessToken, refreshToken:newRefreshToken
      },
      "Access Token Refreshed"
   )
 )
   }catch(error){
      throw new ApiErrorHandel(401,error?.message || "Invalid Refresh Token!!")
   }
})

//-------------------------------------------------------------------------------------
const changeCurrentPassword = asyncHandler(async (req,res) => {

   const {oldPassword,newPassword} = req.body

   const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
      throw new ApiErrorHandel(400,"Invalid Old Password!!")
    }

    user.password=newPassword
     await user.save({validateBeforeSave:false})

     return res.status(200).
     json(new ApiResponseHandel(200,{},"Password Changed Successfully!!"))
})

//-------------------------------------------------------------------------------------

const getCurrentUser = asyncHandler(async (req,res) => {

   return res.status(200)
   .json(200,req.user,"Current User Fetched Successfully!!")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    
   const {fullName,email} = req.body

   if(!fullName || !email){
      throw new ApiErrorHandel(404,"All Filed are required!!")
   }

  const user =  User.findByIdAndUpdate(
      req.user?._id,
       {
        $set:{fullName,email}
       }
      {new:true}
   
   ).select("-password")

   res.status(200).
   json(new ApiResponseHandel(200,user,"Account Details Update successFully!!"))
   
})

//-------------------------------------------------------------------------------------

const updateUserAvatar = asyncHandler(async(req,res) => {
    
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
   throw new ApiErrorHandel(400,"Avatar Image is Missing")
  }
   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
     throw new ApiErrorHandel(400,"Error While Uploading on Avatar!!")
   }
    
  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar:avatar.url
         }
      },
      {new:true}
   ).select("-password")

 return  res.status(200)
   .json(new ApiResponseHandel(200,user,"Avatar Image Successfully Uploaded"))
})

//-------------------------------------------------------------------------------------

const updateUserCoverImage = asyncHandler(async(req,res) => {
    
  const CoverImageLocalPath = req.file?.path

  if(!CoverImageLocalPath){
   throw new ApiErrorHandel(400,"Cover Image is Missing")
  }
   const coverImage = await uploadOnCloudinary(CoverImageLocalPath)

   if(!coverImage.url){
     throw new ApiErrorHandel(400,"Error While Uploading on Cover Image!!")
   }
    
  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage:coverImage.url
         }
      },
      {new:true}
   ).select("-password")

  return res.status(200)
   .json(new ApiResponseHandel(200,user,"Cover Image Successfully Uploaded"))
})



export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}


















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

/*
 LOGIN USER -> 
 1. get data from req body 
 2. username || email based access
 3.find the user 
 4. check for password 
 5. access and refresh token generate
 6. send cookie 
*/