
import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express();
// enable cors middleware use generally use for middlewares
app.use(cors({
    origin:process.env.CORS_ORIGIN, 
    credentials: true
}
)); 

app.use(express.json({limit:'16kb'})) // for handeling json data that generally comes from front end form etc..
app.use(express.urlencoded({extended:true,limit:"16kb"})) // for handeling url encoded data that comes from url. we need to use this middleware for encoding urls..
app.use(express.static("public")) // for serving static files like images,pdf etc in our server...
app.use(cookieParser()) // for handeling cookies -> like i can access cookies and set cookies in our browser from this server


//routes import

import userRouter from './routes/user.routes.js' // nijer moner moto naam tokhn e dite parbi jokhn "export default"  korbi

//routes decleration
app.use("/api/v1/users",userRouter)

// url: http://localhost:8000/api/v1/users/register
//http://localhost:3000/api/v1/users/login
//http://localhost:3000/api/v1/users/signup    => like this url will generate. /user add in prefix for every userRouter's  

export {app} 