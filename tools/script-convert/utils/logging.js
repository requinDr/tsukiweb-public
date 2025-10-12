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