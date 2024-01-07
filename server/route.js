import express from 'express'

import * as routes from './controller.js'

const router = express.Router()

router.post('/register', routes.registerUser)

router.post('/login', routes.loginUser)

export { router }
