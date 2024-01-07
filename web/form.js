const chatBox = document.querySelector('.chat-box')
const form = document.querySelector('form')
const input = document.querySelector('textarea')

const socket = io()

function sendMessage(e) {
  e.preventDefault()

  if (input.value) {
    const date = new Date()
    const hour = date.getHours()
    const minutes = date.getMinutes()

    const message = {
      msgHour: hour,
      msgMinutes: minutes,
      msgText: input.value
    }

    socket.emit('chat message', message)

    form.reset()
  }
}

socket.on('chat message', msg => {
  const messageBox = document.createElement('div')
  const messageTime = document.createElement('span')
  const messageText = document.createElement('span')

  messageBox.classList.add('message-box')
  messageTime.classList.add('message-time')
  messageText.classList.add('message-text')

  messageTime.innerText = `${msg.msgHour}: ${msg.msgMinutes}:`
  messageText.innerText = msg.msgText

  messageBox.append(messageTime, messageText)
  chatBox.append(messageBox)
})

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
  }
})

form.addEventListener('submit', sendMessage)

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.shiftKey) {
    return
  } else if (e.key === 'Enter' && input.value !== '') {
    form.dispatchEvent(new Event('submit'))
  }
})
