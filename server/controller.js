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

export { registerUser, loginUser }
