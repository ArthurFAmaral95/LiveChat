const loginForm = document.querySelector('.login-form')
const userInput = document.querySelector('input#user-login')

const chatBox = document.querySelector('.chat-box')
const messageForm = document.querySelector('.message-form')
const messageInput = document.querySelector('textarea')
const footer = document.querySelector('footer')

let user

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
  if (userInput.value) {
    user = userInput.value

    chatBox.classList.remove('hidden')
    footer.classList.remove('hidden')
    loginForm.classList.add('hidden')

    loginForm.reset()
  }
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
