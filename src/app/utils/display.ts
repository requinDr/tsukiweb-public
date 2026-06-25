export enum SCREEN {
  TITLE = "/",
  WINDOW = "/window",
  CONFIG = "/config",
  LOAD = "/load",
  GALLERY = "/gallery",
  ENDINGS = "/endings",
  SCENES = "/scenes",
  PLUS_DISC = "/plus-disc",
}

export const displayMode: {
  screen: SCREEN
  bgAlignment: 'top' | 'center' | 'bottom'
  bgMoveTime: number
  replaceNavigation: boolean
  navigationState?: unknown
} = {
  screen: SCREEN.TITLE,
  bgAlignment: 'center',
  bgMoveTime: 0,
  replaceNavigation: false,
  navigationState: undefined,
}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.displayMode = displayMode
