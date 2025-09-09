import { observe } from "@tsukiweb-common/utils/Observer"

export const langSelection = {
  ready: false,
}

export function isLanguageLoaded() {
  return langSelection?.ready ?? false
}

export async function waitLanguageLoad() {
  if (isLanguageLoaded()) return
  return new Promise(resolve => {
    observe(langSelection, "ready", resolve, { once: true })
  })
}