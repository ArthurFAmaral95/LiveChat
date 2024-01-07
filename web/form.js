const chatBox = document.querySelector('.chat-box')
const form = document.querySelector('form')
const input = document.querySelector('textarea')

const socket = io()

function sendMessage(e) {
  e.preventDefault()

  if (input.value) {
    socket.emit('chat message', input.value)

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

  messageTime.innerText = 'test'
  messageText.innerText = msg

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
