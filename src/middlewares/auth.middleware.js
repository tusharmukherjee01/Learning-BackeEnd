
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiErrorHandel} from "../utils/ApiErrorHandel.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.models.js"

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")     //Authorization:Bearer <token>
    
        // console.log(token);
        if (!token) {
            throw new ApiErrorHandel(401, "Unauthorized request---->>>>")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiErrorHandel(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiErrorHandel(401, error?.message || "Invalid access token")
    }
    
})