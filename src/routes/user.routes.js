
import {Router} from 'express'
import { registerUser } from '../controlers/user.controller.js' // ai rokom import tpkhn e nite parbo like {} jokhn defalt export hoyni mane same name e use korte hobee  

const router = Router()

router.route("/register").post(registerUser)

export default router