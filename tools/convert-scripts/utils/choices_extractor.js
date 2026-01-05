import fs from 'fs';

const labelRegex = /^\*(f\d+)\s*$/ // Matches lines like "*f123"
const choiceRegex = /`([^`]+)`/g

export const extractLabelOrder = (content) =>
  content
    .split('\n')
    .map(line => line.match(labelRegex)?.[1])
    .filter(Boolean)

export function extractChoicesFromLogic(logicContent) {  
  const choicesByLabel = {}
  let currentLabel = null

  for (const line of logicContent.split('\n')) {
    const label = line.match(labelRegex)?.[1]
    if (label) {
      currentLabel = label
      continue
    }

    if (currentLabel && line.includes('select')) {
      if (Object.hasOwn(choicesByLabel, currentLabel))
        throw Error(`Multiple 'select' in label ${currentLabel}`)
      choicesByLabel[currentLabel] = [...line.matchAll(choiceRegex)].map(m =>
        m[1].trim()
            .replaceAll(/[-―─―—]{2,}/g, (match)=> `[line=${match.length}]`)
      )
    }
  }

  return choicesByLabel
}

export function removeChoiceTexts(logicContent) {
  const choiceRegex = /`([^`]+)`([\s\n]*,[\s\n]*)(\*\w+)/g
  let currentIndex = 0
  return logicContent.replace(choiceRegex, (match, choiceText, separator, nextLabel) => {
    const replacement = nextLabel
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