import { Graphics, RecursivePartial, JSONObject } from "@tsukiweb-common/types";
import { notifyObservers, observe } from "@tsukiweb-common/utils/Observer";
import { Stored } from "@tsukiweb-common/utils/storage";
import { deepAssign, jsonDiff } from "@tsukiweb-common/utils/utils";
import { RouteName, RouteDayName, LabelName } from "types";
import { displayMode, SCREEN } from "./display";

//##############################################################################
//#region               LOCAL TYPES, FUNCTIONS, CONSTANTS
//##############################################################################

type Phase = {
  route: RouteName | "";
  routeDay: RouteDayName | "";
  day: number | RouteDayName<'others'>;
  bg: string;
};

type Audio = {
  track: string | null;
  looped_se: string | null;
};

type Regard = {
  ark: number;
  cel: number; // previous name ciel can be loaded from saves
  aki: number; // previous name akiha can be loaded from saves
  koha: number; // previous name kohaku can be loaded from saves
  his: number; // previous name hisui can be loaded from saves
};

/**
 * Update the regard object from previous version to new version (shorter names)
 */
function regard_update(regard: Record<string, number>): Regard {
  return {
    ark: regard.ark,
    cel: regard.ciel ?? regard.cel,
    aki: regard.akiha ?? regard.aki,
    koha: regard.kohaku ?? regard.koha,
    his: regard.hisui ?? regard.his,
  };
}
const _defaultContext = {
  label: "" as LabelName | "",
  index: -1 as number,
  page: 0 as number,
  text: "" as string,
  audio: { track: null, looped_se: null } as Audio,
  graphics: { bg: "", l: "", c: "", r: "", monochrome: "" } as Graphics,
  textPrefix: "" as string,
  regard: { ark: 0, cel: 0, aki: 0, koha: 0, his: 0 } as Regard,
  flags: [] as string[],
  phase: { route: "", routeDay: "", day: 0, bg: "", } as Phase,
  rockending: -1 as number, // written, but never read in the script.
  flushcount: 0 as number, //used in for loops in the script
  continueScript: true as boolean
};

//#endregion
//##############################################################################

class GameContext extends Stored {

//##############################################################################
//#region                         ATTRS, PROPS
//##############################################################################

//_____________________________private attributes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//------------------position in scenario
  private _label: LabelName | ""; // script block label
  private _page: number; // page number in the scene, starts at 0

//______________________________public attributes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//------------------position in scenario
  index: number; // line index in the labeled script block.

//-----------------text, audio, graphics
  text: string;
  audio: Audio;
  graphics: Graphics;
  textPrefix: string; // used to add bbcode before text lines (for e.g., color or alignement)


//----------------------flags, variables
  regard: Regard;
  flags: string[];
  phase: Phase;
  rockending: number; // written, but never read in the script.
  flushcount: number; //used in for loops in the script
  continueScript: boolean;
//-----------------------------listeners
  pageBreakListener: ((prevPageText: string, newPage: number) => void) | null;
  loadListener: VoidFunction | null;

//_________________________________properties___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  get label() { return this._label; }
  set label(value: LabelName | "") {
    if (value != this._label) {
      this._label = value;
      this.page = 0;
      this.index = -1;
    }
  }

  get page() { return this._page; }
  set page(value: number) {
    if (value != this._page) {
        this._page = value;
        this.text = "";
    }
  }

//#endregion ###################################################################
//#region                     CONSTRUCTOR, METHODS
//##############################################################################

  constructor() {
    super('gameContext', true, true);
    ({
      label: this._label,
      page: this._page,
      index: this.index,
      text: this.text,
      audio: this.audio,
      graphics: this.graphics,
      textPrefix: this.textPrefix,
      regard: this.regard,
      flags: this.flags,
      rockending: this.rockending,
      flushcount: this.flushcount,
      phase: this.phase,
      continueScript: this.continueScript
    } = deepAssign({}, _defaultContext));
    this.pageBreakListener = null;
    this.loadListener = null;
  }

//_______________________________public methods_________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  load(obj: RecursivePartial<typeof _defaultContext>,
    continueScript: boolean = this.continueScript) {
    const values = deepAssign(_defaultContext, obj, { clone: true });
    // translate old regard names to new regard names
    values.regard = regard_update(values.regard);
    values.continueScript = continueScript;
    deepAssign(this, values, { extend: false });
    this.loadListener?.();
    // force re-processing current line if the index is unchanged
    notifyObservers(this, 'index');
    notifyObservers(this, 'page');
  }

  reset() {
    this.load({});
  }

  pageJson() {
    return {
      label: this.label,
      page: this.page,
      ...jsonDiff({
        text: this.text,
        audio: this.audio,
        graphics: this.graphics,
        textPrefix: this.textPrefix,
        phase: {
          route: this.phase.route,
          routeDay: this.phase.routeDay,
          day: this.phase.day
        }
      }, _defaultContext),
    };
  }

  sceneJson() {
    return {
      label: this.label,
      ...jsonDiff({
        regard: this.regard,
        flags: this.flags
      }, _defaultContext)
    };
  }

//_________________________private & protected methods__________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  protected serializeToStorage(): string {
    return JSON.stringify(jsonDiff({
      ...this.sceneJson(),
      ...this.pageJson(),
      continueScript: this.continueScript
    } as JSONObject, _defaultContext));
  }
  protected deserializeFromStorage(str: string): void {
    const { continueScript, ...context } = JSON.parse(str);
    this.load(context, continueScript);
  }
//#endregion
//##############################################################################

}

//##############################################################################
//#region                        INITIALIZATION
//##############################################################################

const gameContext = new GameContext();
export { gameContext };

window.addEventListener('load', () => {
  gameContext.restoreFromStorage();
  observe(displayMode, 'screen', (screen) => {
    if (screen != SCREEN.WINDOW) {
      gameContext.reset();
    }
  });
});
