
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiErrorHandel} from "../utils/ApiErrorHandel.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponseHandel} from "../utils/ApiResponseHandel.js"
import jwt from "jsonwebtoken"
import mongoose from 'mongoose'

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
//   const coverImageLocalPath = req.files?.coverImage[0]?.path; // in this code what happend if cover image not send then throwing error like "can't read property of undefined" => because i did't check for cover image present or not . so, i have to checck

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
?.kh 
const loginUser = asyncHandler(async (req,res) => {
 
   //step:1
   const {email,password,username} = req.body;
    //step:2
   if(!(username || email)){
      throw new ApiErrorHandel(400,"Username or Password is Required")
   }
   //step:3
  const user = await User.findOne({
      $or:[{ username },{ email }]
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
   .json(new ApiResponseHandel(200,req.user,"Current User Fetched Successfully!!")) // must pass throw jwtVerify middleware only you will get req.user
}

const updateAccountDetails = asyncHandler(async(req,res)=>{
    
   const {fullName,email} = req.body

   if(!fullName || !email){
      throw new ApiErrorHandel(404,"All Filed are required!!")
   }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
       {
        $set:{fullName,email}
       },
      {new:true} // nothing but return after update the updated document
   
   ).select("-password")

   res
   .status(200).
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

//-------------------------------------------------------------------------------------
 
const getUserChannelProfile = asyncHandler(async(req,res) => {
 
   const {username} = req.params;

   if(!username?.trim()){
      throw new ApiErrorHandel(400,"User Name is Missing!!")
   }

   const channel = await User.aggregate([
      {
         $match:{
            username : username?.toLowerCase()
         }
      },
      {
         $lookup:{
            from:"subscriptions",   // Subscription => will be converted to "subscriptions" at the time of store in MONGODB thats why use "subscriptions"
            localField:"_id",
            foreignFiled:"channel" , // select channel how it works ?? check video no.18
            as:"subscribers"
         }
      },
      {
         $lookup:{
            from:"subscriptions",   // Subscription => will be converted to "subscriptions" at the time of store in MONGODB thats why use "subscriptions"
            localField:"_id",
            foreignFiled:"subscriber", // select channel how it works ?? check video no.18
            as:"subscribedTo"
         }
      },
      {
         $addFields:{  // add this fileds in User object
            subscribersCount :{
               $size:"$subscribers"    // $size => will tell us count of subscribers filed (or document) || {$subscribers => because subscribers is a field} , syntax bro you can't do anything...
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo" // same explanation as upper
            },
            isSubscribed:{
               $cond:{
                  if:{$in: [req.user?._id,"$subscribers.subscriber"]},  // what is going on ? => $subscribers filed subscriber(in schema) object which is user acctually -> check in that subscriber "req.user?._id" present or not
                  then:true,
                  else:false 
               }
            }
         }
      },
      {
         $project:{  // this acctually whatever i required only that filed will send by flag value 1 menas will sent that value..
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1,
         }
      }
   ])
  
   /*
   console.log(channel) :
   [
  {
    fullName: "John Doe", // User's full name
    username: "johndoe", // User's username
    subscribersCount: 25, // Count of subscribers
    channelsSubscribedToCount: 10, // Count of channels the user is subscribed to
    isSubscribed: true, // Whether the current user is subscribed to this user
    avatar: "avatar-url.jpg", // User's avatar image URL
    coverImage: "cover-image-url.jpg", // User's cover image URL
    email: "john.doe@example.com" // User's email address
  }
]

   */

   if(!channel?.length){
      throw new ApiErrorHandel(400,"Channel Does't Exists!!")
   }

   return res.status(200)
   .json( new ApiResponseHandel(200,channel[0]),"User Channel Fetched Successfully!!")
})
//-----------------------------------------------
  const getWatchHistory = asyncHandler(async(req,res) => {
      
   const user = await User.aggregate([
      {
         $match:{
            _id: new mongoose.Types.ObjectId(req.user._id) // in general "req.user?._id" is a string but mongoose convert it in mongodb id ObjectId('6467788233') like this ,, but but in case of aggregation pipeline every code go directly mongoose not work here that is why you need to convert it in mongodb id... 
         }
      },
      {
         $lookup:{
            from:"videos",   
            localField:"watchHistory",
            foreignFiled:"_id", // select channel how it works ?? check video no.18
            as:"watchHistory",
            pipeline:[
               {
                  $lookup:{
                     from:"users",
                     localField:"owner",
                     foreignField:"_id",
                     as:"owner",
                     pipeline:[
                        {
                           $project:{
                              fullName:1,
                              username:1,
                              avatar:1
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields:{
                     owner:{
                        $first:"$owner"
                     }
                  }
               }
            ]
         }
      }
   ])
// print user =>
      /*
      [
   {
      _id: ObjectId("64a9d2b5e5f8ab1234567890"), // User ID
      watchHistory: [
         {
            _id: ObjectId("650c1234abc5678901234567"), // Video 1 ID
            owner: {
               fullName: "John Doe",
               username: "john_doe",
               avatar: "https://example.com/avatar/john.jpg"
            }
         },
         {
            _id: ObjectId("650c5678def1234567890123"), // Video 2 ID
            owner: {
               fullName: "Jane Smith",
               username: "jane_smith",
               avatar: "https://example.com/avatar/jane.jpg"
            }
         }
      ]
   }
]

      */
   res.
   status(200)
   .json(new ApiResponseHandel(200,user[0].watchHistory,"Watch History Fetch SuccessFully"))
  })


export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}


















/*
Register a User Steps:
1.get user details from frontend(client)
2.validation {checking correct order of data or email format , !empty checking }
3.check if user already exists {check with email or username for unique data}
4.check for images , check for avatar => upload them to cloudinary
5.create a object for store data in mongoDB(nosql) - create entry in DB
6.remove password and refresh token filed from response => i don't wanna send this filed to frontend
7.check for user creation
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

/*
"req.user._id " => from here you get a string but mongoDB id is Object('8574589275752575') like that => under the hood mongose work and convert it in acctual format 
   
but aggregation pipeline not work with mongoose you have to convert it manually
*/


