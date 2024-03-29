import { knx } from './db.js'

const crypto = await import('crypto')

const registerUser = async (req, res) => {
  knx
    .insert([
      {
        user_name: req.body.userName,
        password: crypto
          .createHash('sha1')
          .update(req.body.password)
          .digest('hex')
      }
    ])
    .into('users')
    .then(user => {
      console.log(`${req.body.userName} registerd in DB successfully.`)
      res.send({
        message: `Welcome, ${req.body.userName}`,
        userId: user[0]
      })
    })
    .catch(err => {
      console.log('Error at registering new user.')
      res.status(400).send(err)
    })
}

const loginUser = async (req, res) => {
  let userId
  let chats
  let loginError = false
  await knx
    .select('*')
    .from('users')
    .whereLike('user_name', `${req.body.userName}`)
    .then(user => {
      if (user.length === 0) {
        console.log(`User ${req.body.userName} not found in DB.`)
        loginError = true
        return res
          .status(400)
          .send({ error: 'user', message: 'User not found' })
      } else if (
        user[0].password !==
        crypto.createHash('sha1').update(req.body.password).digest('hex')
      ) {
        console.log('Wrong password.')
        loginError = true
        return res
          .status(400)
          .send({ error: 'password', message: 'Wrong password' })
      } else {
        console.log(`${req.body.userName} found in DB.`)
        userId = user[0].user_id
      }
    })
    .then(async () => {
      if (!loginError) {
        await knx
          .table('chats_users')
          .join('users', 'chats_users.user_id', '=', 'users.user_id')
          .join('chats', 'chats_users.chat_id', '=', 'chats.chat_id')
          .select('users.user_name', 'chats_users.chat_id', 'chats.users')
          .where('users.user_id', userId)
          .then(data => {
            chats = data
          })
          .catch(err => {
            console.log(`Failed to retrieve chats from ${req.body.userName}`)
            res.status(400).send(err)
          })
      }
    })
    .then(() => {
      if (!loginError) {
        res.send({
          message: `Welcome, ${req.body.userName}`,
          userId: userId,
          userChats: chats
        })
        console.log(`${req.body.userName} logged in.`)
      }
    })
    .catch(err => {
      console.log('Error at logging in.')
      console.log(userId)
      res.status(400).send(err)
    })
}

const newChat = async (req, res) => {
  let overallError = false
  let userError = false
  let chatError = false

  const users = []

  let newChatId

  for (const user of req.body.users) {
    await knx
      .select('*')
      .from('users')
      .whereLike('user_name', user)
      .then(userData => {
        if (userData.length === 0) {
          userError = true
          console.log(`User ${user} not found in DB.`)
          return res
            .status(400)
            .send({ error: 'user', message: `User (${user}) not found` })
        } else {
          const userObj = {
            name: userData[0].user_name,
            userId: userData[0].user_id
          }

          users.push(userObj)
          console.log(`${user} found in DB.`)
        }
      })
      .catch(err => {
        overallError = true
        console.log('Error at finding users.')
        res.status(400).send(err)
      })
  }

  if (userError || overallError) {
    return
  } else {
    const reverseUsers = [...users].reverse()
    await knx
      .select('*')
      .from('chats')
      .whereLike('users', JSON.stringify(reverseUsers))
      .then(match => {
        if (match.length !== 0) {
          console.log('Other user have already initiated a chat.')
          chatError = true
          return res.status(400).send({
            error: 'chat',
            message: 'You already have a chat with this person.'
          })
        } else {
          console.log('Other user never initiated chat: OK.')
        }
      })
      .catch(err => {
        overallError = true
        console.log('Error checking if other user had initiaded chat.')
        res.status(400).send(err)
      })

    if (chatError || overallError) {
      return
    } else {
      await knx
        .insert([
          {
            users: JSON.stringify(users)
          }
        ])
        .into('chats')
        .then(chat => {
          newChatId = chat[0]
          console.log(`Chat #${chat[0]} registerd in table "chats"`)
          users.map(user => {
            knx
              .insert([
                {
                  chat_id: chat[0],
                  user_id: user.userId
                }
              ])
              .into('chats_users')
              .then(() => {
                console.log(
                  `New line added to table "chats_users": chat: ${chat[0]} , user: ${user.userId}. OK`
                )
              })
              .catch(err => {
                console.log(
                  'Error at registering new line in table "chats_users".'
                )
                res.status(400).send(err)
              })
          })
        })
        .then(() => {
          console.log('All data registered successfully.')
          res.status(200).send({
            message: 'New chat registered successfully!',
            chat: {
              chatId: newChatId,
              chatReceiver: users[1].name,
              chatReceiverId: users[1].userId
            }
          })
        })
        .catch(err => {
          overallError = true
          console.log('Error at registering new chat at table "chats"')
          res.status(400).send(err)
        })
    }
  }
}

const sendMessage = async (req, res) => {
  knx
    .insert([
      {
        chat_id: req.body.chatId,
        sender_user_id: req.body.sender,
        receiver_user_id: req.body.receiver,
        message_time: req.body.time,
        message_content: req.body.content
      }
    ])
    .into('messages')
    .then(response => {
      console.log(
        `User ${req.body.sender} sent a message to ${req.body.receiver}. Message #${response[0]}`
      )
      res.status(200).send({ message: 'Message deliverd.' })
    })
    .catch(() => {
      res.status(400).send({
        error: 'message delivery error',
        message: 'Unable to deliver message.'
      })
    })
}

const fetchChatMessages = async (req, res) => {
  knx
    .table('messages')
    .join('users', 'messages.sender_user_id', '=', 'users.user_id')
    .select(
      'messages.sender_user_id',
      'messages.receiver_user_id',
      'users.user_name as sender_name',
      'messages.message_time',
      'messages.message_content'
    )
    .where('messages.chat_id', req.body.chatId)
    .then(messages => {
      console.log(`Messages from chat ${req.body.chatId} fetched`)
      res.status(200).send(messages)
    })
    .catch(err => {
      res.send(err)
    })
}

export { registerUser, loginUser, newChat, sendMessage, fetchChatMessages }
