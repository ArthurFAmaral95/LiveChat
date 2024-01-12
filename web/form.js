import axios from 'axios'

const loginForm = document.querySelector('.login-form')
const userLogin = document.querySelector('input#user-login')
const passwordLogin = document.querySelector('input#password-login')

const registerForm = document.querySelector('.register-form')
const userRegister = document.querySelector('input#user-register')
const passwordRegister = document.querySelector('input#password-register')

const aside = document.querySelector('aside')
const newChatBtn = document.querySelector('button#new-chat')
const square = document.querySelector('div.square')
const newChatForm = document.querySelector('form.new-chat-form')
const chats = document.querySelector('ul.chats')

const chatBox = document.querySelector('.chat-box')
const messageForm = document.querySelector('.message-form')
const messageInput = document.querySelector('textarea')

const footer = document.querySelector('footer')

let user
let userId
let rawUserChatsData
const userChatsData = []

let currentChat
let receiverId

const socket = io()

function sendMessage(e) {
  e.preventDefault()

  if (messageInput.value && currentChat) {
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

    axios
      .post('http://localhost:3000/newMessage', {
        chatId: currentChat,
        sender: userId,
        receiver: receiverId,
        time: date,
        content: JSON.stringify(messageInput.value)
      })
      .then(() => {
        socket.emit('chat message', message, receiverId, currentChat)
      })
      .catch(err => {
        console.error(err)
      })

    messageForm.reset()
  }
}

function loginUser(e) {
  e.preventDefault()

  axios
    .post('http://localhost:3000/login', {
      userName: userLogin.value.toUpperCase(),
      password: passwordLogin.value
    })
    .then(response => {
      console.log(response.data.message)

      user = userLogin.value.toUpperCase()
      userId = response.data.userId
      rawUserChatsData = response.data.userChats
    })
    .then(() => {
      rawUserChatsData.map(chat => {
        let usersInChat = JSON.parse(chat.users)
        usersInChat.map(chatUser => {
          if (chatUser.name !== user) {
            const chatDetails = {
              chatId: chat.chat_id,
              otherUserInChat: chatUser.name,
              otherUserInChatId: chatUser.userId
            }

            userChatsData.push(chatDetails)
          }
        })
      })
    })
    .then(() => {
      userChatsData.map(chat => {
        let lastMessage

        axios
          .post('http://localhost:3000/fetchMessages', {
            chatId: chat.chatId
          })
          .then(response => {
            lastMessage = JSON.parse(
              response.data[response.data.length - 1].message_content
            )
          })
          .then(() => {
            const chatItem = document.createElement('li')
            const userSpan = document.createElement('span')
            const messageSpan = document.createElement('span')
            const container = document.createElement('div')
            const newMessagesCount = document.createElement('span')

            chatItem.classList.add('chat')
            chatItem.setAttribute('data-chatid', chat.chatId)
            chatItem.setAttribute('data-receiver', chat.otherUserInChat)
            chatItem.setAttribute('data-receiverid', chat.otherUserInChatId)
            newMessagesCount.classList.add('count')
            newMessagesCount.classList.add('hidden')
            container.classList.add('container')

            userSpan.classList.add('user')
            messageSpan.classList.add('last-message')

            userSpan.textContent = chat.otherUserInChat.toLowerCase()
            messageSpan.textContent = lastMessage
            newMessagesCount.value = 0

            container.append(userSpan, messageSpan)
            chatItem.append(container, newMessagesCount)
            chats.append(chatItem)
          })
          .then(() => {
            const chatListItem = document.querySelectorAll('li.chat')

            chatListItem.forEach(item => {
              item.addEventListener('click', () => {
                const newMessageCountSpan = document.querySelector(
                  `li.chat[data-chatid="${item.dataset.chatid}"] .count`
                )
                updateCurrentChat(item.dataset.chatid, item.dataset.receiverid)

                chatListItem.forEach(item => {
                  item.classList.remove('selected')
                })

                item.classList.add('selected')
                fetchMessages(item.dataset.chatid)

                newMessageCountSpan.value = 0
                newMessageCountSpan.classList.add('hidden')
              })
            })
          })
          .catch(err => {
            console.error(err)
          })
      })
    })
    .then(() => {
      chatBox.classList.remove('hidden')
      footer.classList.remove('hidden')
      aside.classList.remove('hidden')
      document.body.classList.remove('sidebar-hidden')
      loginForm.classList.add('hidden')
      registerForm.classList.add('hidden')

      loginForm.reset()
    })
    .then(() => {
      socket.emit('login', userId)
    })
    .catch(err => {
      const errorMessages = document.querySelectorAll('span.error')
      errorMessages.forEach(message => {
        message.remove()
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
      userName: userRegister.value.toUpperCase(),
      password: passwordRegister.value
    })
    .then(response => {
      console.log(response.data.message)

      user = userRegister.value.toUpperCase()
      userId = response.data.userId

      chatBox.classList.remove('hidden')
      footer.classList.remove('hidden')
      aside.classList.remove('hidden')
      document.body.classList.remove('sidebar-hidden')
      loginForm.classList.add('hidden')
      registerForm.classList.add('hidden')

      registerForm.reset()
    })
    .catch(err => {
      const errorMessages = document.querySelectorAll('span.error')
      errorMessages.forEach(message => {
        message.remove()
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

function starNewChat() {
  square.classList.toggle('hidden')
  newChatForm.classList.toggle('hidden')

  const newChatInput = document.querySelector('input#new-chat-user')

  newChatForm.addEventListener('submit', e => {
    e.preventDefault()

    const usersOfNewChat = [user, newChatInput.value.toUpperCase()]

    const data = {
      users: usersOfNewChat
    }

    axios
      .post('http://localhost:3000/newChat', data)
      .then(response => {
        const chatItem = document.createElement('li')
        const userSpan = document.createElement('span')
        const messageSpan = document.createElement('span')

        chatItem.classList.add('chat')
        chatItem.setAttribute('data-chatid', response.data.chat.chatId)
        chatItem.setAttribute('data-receiver', response.data.chat.chatReceiver)
        chatItem.setAttribute(
          'data-receiverid',
          response.data.chat.chatReceiverId
        )

        userSpan.classList.add('user')
        messageSpan.classList.add('last-message')

        userSpan.textContent = response.data.chat.chatReceiver.toLowerCase()
        messageSpan.textContent = 'last message'

        chatItem.append(userSpan, messageSpan)
        chats.append(chatItem)
      })
      .then(() => {
        square.classList.add('hidden')
        newChatForm.classList.add('hidden')

        newChatForm.reset()
      })
      .catch(err => {
        const errorMessages = document.querySelectorAll('span.error')

        errorMessages.forEach(message => {
          message.remove()
        })

        const labels = document.querySelector('.labels.new-chat')
        const errorMessage = document.createElement('span')

        errorMessage.classList.add('error')

        if (err.response.data.errno === 19) {
          errorMessage.textContent = 'Chat already exists'

          labels.append(errorMessage)
        } else if (err.response.data.error === 'user') {
          errorMessage.textContent = err.response.data.message

          labels.append(errorMessage)
        } else {
          console.error(err)
        }
      })
  })
}

function updateCurrentChat(chatId, receiver) {
  currentChat = chatId
  receiverId = receiver
}

function fetchMessages(chatId) {
  axios
    .post('http://localhost:3000/fetchMessages', {
      chatId: chatId
    })
    .then(messages => {
      const allMessagesBoxes = document.querySelectorAll('div.message-box')
      allMessagesBoxes.forEach(box => {
        box.remove()
      })

      const messageArray = messages.data

      messageArray.map(message => {
        const messageBox = document.createElement('div')
        const messageUser = document.createElement('span')
        const messageTime = document.createElement('span')
        const messageText = document.createElement('span')

        messageBox.classList.add('message-box')
        messageUser.classList.add('message-user')
        messageTime.classList.add('message-time')
        messageText.classList.add('message-text')

        if (message.sender_user_id === userId) {
          messageBox.classList.add('own-message')
        } else {
          messageBox.classList.add('outside-message')
          messageUser.innerText = message.sender_name.toLowerCase()
        }

        const dateTimeZone = new Date(message.message_time)
        const messageHours = dateTimeZone.getHours()
        let messageMinutes

        if (dateTimeZone.getMinutes() < 10) {
          messageMinutes = `0${dateTimeZone.getMinutes()}`
        } else {
          messageMinutes = dateTimeZone.getMinutes()
        }

        messageTime.innerText = `${messageHours}:${messageMinutes}`
        messageText.innerText = JSON.parse(message.message_content)

        messageBox.append(messageUser, messageText, messageTime)
        chatBox.append(messageBox)

        chatBox.scrollTo(0, chatBox.scrollHeight)
      })
    })
    .catch(err => {
      console.error(err)
    })
}

function updateLastMessage(chatId, message) {
  const chatLi = document.querySelector(`li.chat[data-chatid="${chatId}"] `)

  const lastMessageSpan = document.querySelector(
    `li.chat[data-chatid="${chatId}"] .last-message`
  )

  const newMessageCountSpan = document.querySelector(
    `li.chat[data-chatid="${chatId}"] .count`
  )

  if (!chatLi.classList.contains('selected')) {
    newMessageCountSpan.textContent = ++newMessageCountSpan.value
    newMessageCountSpan.classList.remove('hidden')
  }

  lastMessageSpan.textContent = message
}

socket.on('chat message', (msg, chat) => {
  updateLastMessage(chat, msg.msgText)

  if (chat == currentChat) {
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
      messageUser.innerText = msg.user.toLowerCase()
    }

    messageTime.innerText = `${msg.msgHour}:${msg.msgMinutes}`
    messageText.innerText = msg.msgText

    messageBox.append(messageUser, messageText, messageTime)
    chatBox.append(messageBox)

    chatBox.scrollTo(0, chatBox.scrollHeight)
  }
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

newChatBtn.addEventListener('click', starNewChat)
