import axios from 'axios'

const loginForm = document.querySelector('.login-form')
const userLogin = document.querySelector('input#user-login')
const passwordLogin = document.querySelector('input#password-login')

const registerForm = document.querySelector('.register-form')
const userRegister = document.querySelector('input#user-register')
const passwordRegister = document.querySelector('input#password-register')

const chats = document.querySelector('aside')

const chatBox = document.querySelector('.chat-box')
const messageForm = document.querySelector('.message-form')
const messageInput = document.querySelector('textarea')

const footer = document.querySelector('footer')

let user
let userId

const socket = io()

function sendMessage(e) {
  e.preventDefault()

  if (messageInput.value) {
    const date = new Date()
    const hour = date.getHours()
    let minutes

    if (date.getMinutes() < 10) {
      minutes = `0${date.getMinutes()}`
    } else {
      minutes = date.getMinutes()
    }

    const message = {
      msgHour: hour,
      msgMinutes: minutes,
      msgText: messageInput.value,
      user: user
    }

    socket.emit('chat message', message)

    messageForm.reset()
  }
}

function loginUser(e) {
  e.preventDefault()

  axios
    .post('http://localhost:3000/login', {
      userName: userLogin.value,
      password: passwordLogin.value
    })
    .then(response => {
      console.log(response.data.message)

      user = userLogin.value
      userId = response.data.userId
    })
    .then(() => {
      chatBox.classList.remove('hidden')
      footer.classList.remove('hidden')
      chats.classList.remove('hidden')
      loginForm.classList.add('hidden')
      registerForm.classList.add('hidden')

      loginForm.reset()
    })
    .catch(err => {
      const errorMessages = document.querySelectorAll('span.error')
      errorMessages.forEach(message => {
        message.textContent = ''
      })

      if (err.response.data.error === 'user') {
        const labels = document.querySelector('.labels.user-login')
        const errorMessage = document.createElement('span')

        errorMessage.classList.add('error')

        errorMessage.textContent = err.response.data.message

        labels.append(errorMessage)
      } else if (err.response.data.error === 'password') {
        const labels = document.querySelector('.labels.password-login')
        const errorMessage = document.createElement('span')

        errorMessage.classList.add('error')

        errorMessage.textContent = err.response.data.message

        labels.append(errorMessage)
      } else {
        console.error(err)
      }
    })
}

function registerNewUser(e) {
  e.preventDefault()

  axios
    .post('http://localhost:3000/register', {
      userName: userRegister.value,
      password: passwordRegister.value
    })
    .then(response => {
      console.log(response.data)

      user = userRegister.value

      chatBox.classList.remove('hidden')
      footer.classList.remove('hidden')
      chats.classList.remove('hidden')
      loginForm.classList.add('hidden')
      registerForm.classList.add('hidden')

      registerForm.reset()
    })
    .catch(err => {
      const errorMessages = document.querySelectorAll('span.error')
      errorMessages.forEach(message => {
        message.textContent = ''
      })

      if (err.response.data.errno === 19) {
        const labels = document.querySelector('.labels.user-register')
        const errorMessage = document.createElement('span')

        errorMessage.classList.add('error')

        errorMessage.textContent = 'User already registered'

        labels.append(errorMessage)
      }
    })
}

socket.on('chat message', msg => {
  const messageBox = document.createElement('div')
  const messageUser = document.createElement('span')
  const messageTime = document.createElement('span')
  const messageText = document.createElement('span')

  messageBox.classList.add('message-box')
  messageUser.classList.add('message-user')
  messageTime.classList.add('message-time')
  messageText.classList.add('message-text')

  if (msg.user === user) {
    messageBox.classList.add('own-message')
  } else {
    messageBox.classList.add('outside-message')
    messageUser.innerText = msg.user
  }

  messageTime.innerText = `${msg.msgHour}:${msg.msgMinutes}`
  messageText.innerText = msg.msgText

  messageBox.append(messageUser, messageText, messageTime)
  chatBox.append(messageBox)

  chatBox.scrollTo(0, chatBox.scrollHeight)
})

loginForm.addEventListener('submit', loginUser)

registerForm.addEventListener('submit', registerNewUser)

messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
  }
})

messageForm.addEventListener('submit', sendMessage)

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.shiftKey) {
    return
  } else if (e.key === 'Enter' && messageInput.value !== '') {
    messageForm.dispatchEvent(new Event('submit'))
  }
})
