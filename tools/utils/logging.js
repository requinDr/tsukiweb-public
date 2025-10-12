import readline from 'readline'

export const logProgress = text => {
  if (process.stdout.isTTY) {
    readline.cursorTo(process.stdout, 0)
    readline.clearLine(process.stdout, 0)
    process.stdout.write(text)
  }
}

export const logError = msg => {
  if (process.stdout.isTTY) {
    readline.cursorTo(process.stdout, 0)
    readline.clearLine(process.stdout, 0)
  }
  console.error(msg)
}


export const logProgressLines = (() => {
  const lines = {}
  const order = []
  
  return (key, text) => {
    if (!process.stdout.isTTY) return

    if (!lines[key]) {
      lines[key] = ''
      order.push(key)
      process.stdout.write('\n')
    }

    lines[key] = text

    const totalLines = order.length
    
    readline.cursorTo(process.stdout, 0, null)
    readline.moveCursor(process.stdout, 0, -totalLines)

    order.forEach((k) => {
      readline.cursorTo(process.stdout, 0)
      readline.clearLine(process.stdout, 0)
      process.stdout.write(lines[k] + '\n')
    })
  }
})()
