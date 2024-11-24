
import mongoose ,{Schema}from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt, { compare } from 'bcrypt'
const userSchema = new mongoose.Schema({
   
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true, // when searching is required without index searching can be done but using index it will be little bit optimise......
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        index:true,
        trim:true,
    },
    avatar:{
        type:String, // cloudinary url->that will give image
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
        type:Schema.Types.ObjectId,
        ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,'Password is Required'],
    },
    refreshToken:{
        type:String
    }
},{timestamps:true})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password){
  return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
   return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
   return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",userSchema)

/*
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()
    this.password = bcrypt.hash(this.password,10)
    next()
})

->userSchema.pre (save) just before save the password this.password do hash and because middleware call next function...
->why not use arrow function ?? => arrow function do not have "this" thats is why without this how you refer this.password has to be change(hash)
->bcrypt.hash(this.password,10) => this.password will hash and algo has 10 round you can pass diffrent also...
->if(!this.isModified("password")) return next() => whitout this it will call this function after change naany filed like if we change our avatar then we dont need to hash our password again and again , so tahts why we chach is filed only password then change other wise only return next()
*/

/* 
Schema has methods property you can inject methods in it here iPasswordCorrect method injected which is gonna check our password(parameter) and this.password(stored in db) is match or not return correponding true or false
*/