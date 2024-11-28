
import {Router} from 'express'
import { registerUser } from '../controlers/user.controller.js' // ai rokom import tpkhn e nite parbo like {} jokhn defalt export hoyni mane same name e use korte hobee  
import {upload} from "../middlewares/multer.middleware.js"
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser)

export default router





/*
upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    THIS PART IS MIDDLEWARE INJECTION HOW YOU INJECT MIDDLEWARE...

*/