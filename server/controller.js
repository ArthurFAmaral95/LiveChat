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
    .then(() => {
      console.log(`${req.body.userName} registerd in DB successfully.`)
      res.send(`Welcome, ${req.body.userName}`)
    })
    .catch(err => {
      console.log('Error at registering new user.')
      res.status(400).send(err)
    })
}

const loginUser = async (req, res) => {
  let userId
  let chats
  await knx
    .select('*')
    .from('users')
    .whereLike('user_name', `${req.body.userName}`)
    .then(user => {
      if (user.length === 0) {
        console.log(`User ${req.body.userName} not found in DB.`)
        return res
          .status(400)
          .send({ error: 'user', message: 'User not found' })
      } else if (
        user[0].password !==
        crypto.createHash('sha1').update(req.body.password).digest('hex')
      ) {
        console.log('Wrong password.')
        return res
          .status(400)
          .send({ error: 'password', message: 'Wrong password' })
      } else {
        console.log(`${req.body.userName} found in DB.`)
        userId = user[0].user_id
      }
    })
    .then(async () => {
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
    })
    .then(() => {
      res.send({
        message: `Welcome, ${req.body.userName}`,
        userId: userId,
        userChats: chats
      })
      console.log(`${req.body.userName} logged in.`)
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
          console.log(`Chat #${chat[0]} registerd in table "chat"`)
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
          res.status(200).send({ message: 'New chat registered successfully!' })
        })
        .catch(err => {
          overallError = true
          console.log('Error at registering new chat at table "chats"')
          res.status(400).send(err)
        })
    }
  }
}

export { registerUser, loginUser, newChat }
