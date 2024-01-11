import express from 'express'

import * as routes from './controller.js'

const router = express.Router()

router.post('/register', routes.registerUser)

router.post('/login', routes.loginUser)

router.post('/newChat', routes.newChat)

router.post('/newMessage', routes.sendMessage)

router.post('/fetchMessages', routes.fetchChatMessages)

export { router }
