const form = document.querySelector('form')
const message = document.querySelector('textarea')

function sendMessage(e) {
  e.preventDefault()

  if (message.value !== '') {
    console.log(message.value)

    form.reset()
  }
}

message.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
  }
})

form.addEventListener('submit', sendMessage)

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.shiftKey) {
    return
  } else if (e.key === 'Enter' && message.value !== '') {
    form.dispatchEvent(new Event('submit'))
  }
})
