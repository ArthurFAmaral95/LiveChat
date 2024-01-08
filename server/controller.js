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
      res.send(`Welcome, ${req.body.userName}`)
    })
    .catch(err => {
      res.status(400).send(err)
    })
}

const loginUser = async (req, res) => {
  knx
    .select('*')
    .from('users')
    .whereLike('user_name', `${req.body.userName}`)
    .then(user => {
      if (user.length === 0) {
        return res
          .status(400)
          .send({ error: 'user', message: 'User not found' })
      } else if (
        user[0].password !==
        crypto.createHash('sha1').update(req.body.password).digest('hex')
      ) {
        return res
          .status(400)
          .send({ error: 'password', message: 'Wrong password' })
      } else {
        res.send(`Welcome, ${req.body.userName}`)
      }
    })
    .catch(err => {
      res.json(err)
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
          return res
            .status(400)
            .send({ error: 'user', message: `User (${user}) not found` })
        } else {
          const userObj = {
            name: userData[0].user_name,
            userId: userData[0].user_id
          }

          users.push(userObj)
        }
      })
      .catch(err => {
        overallError = true
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
          chatError = true
          return res.status(400).send({
            error: 'chat',
            message: 'You already have a chat with this person.'
          })
        }
      })
      .catch(err => {
        overallError = true
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
        .then(() => {
          res.send('New chat registered successfully!')
        })
        .catch(err => {
          overallError = true
          res.status(400).send(err)
        })

      if (overallError) {
        return
      } else {
        console.log('opa')
      }
    }
  }
}

export { registerUser, loginUser, newChat }
