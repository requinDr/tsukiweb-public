import fs from 'fs';

export function extractChoicesFromLogic(logicContent) {
  const choices = []
  const choiceRegex = /`([^`]+)`[\s\n]*,[\s\n]*\*\w+/g
  let match
  while ((match = choiceRegex.exec(logicContent)) != null) {
    choices.push(match[1].trim())
  }
  return choices
}

export function replaceChoicesWithIndices(logicContent) {
  const choiceRegex = /`([^`]+)`([\s\n]*,[\s\n]*\*\w+)/g
  let currentIndex = 0
  return logicContent.replace(choiceRegex, (match, choiceText, suffix) => {
    const replacement = `\`${currentIndex}\`${suffix}`
    currentIndex++
    return replacement
  })
}

export function updateGameJsonWithChoices(gameJsonPath, choices) {
  if (!fs.existsSync(gameJsonPath)) {
    console.warn(`game.json not found at ${gameJsonPath}`)
    return
  }
  
  try {
    const gameJson = JSON.parse(fs.readFileSync(gameJsonPath, 'utf-8'))
    gameJson.choices = choices
    fs.writeFileSync(gameJsonPath, JSON.stringify(gameJson, null, 2) + '\n')
  } catch (error) {
    console.error(`Error updating game.json at ${gameJsonPath}:`, error.message)
  }
}