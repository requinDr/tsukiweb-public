export class StoredValue<T> {
  private name: string;
  private storage: Storage;
  private stringify: (v: T) => string;
  private parse: (v: string) => T;

  constructor(name: string, session: boolean,
      stringify: (v: T)=> string, parse: (v: string)=> T,
      onBlur?: ()=>(T|null)) {
    this.name = name
    this.storage = session ? sessionStorage : localStorage
    this.stringify = stringify
    this.parse = parse

    if (onBlur) {
      document.addEventListener("visibilitychange", ()=> {
        if (document.visibilityState == "hidden") {
          const obj = onBlur()
          if (obj) {
            this.set(obj)
          }
        }
      })
    }
  }

  set(value: T) {
    this.storage.setItem(this.name, this.stringify(value))
  }

  exists() {
    return this.storage.getItem(this.name) != null
  }

  get(): T | null {
    const str = this.storage.getItem(this.name)
    if (str == null)
      return null
    return this.parse(str)
  }

  delete() {
    this.storage.removeItem(this.name)
  }
}

export class StoredJSON<T> extends StoredValue<T> {
  constructor(name: string, session: boolean, onBlur?: ()=>(T|null)) {
    super(name, session, JSON.stringify, JSON.parse, onBlur)
  }
}