import { useEffect, useState } from "react"
import { deepAssign, extract } from "@tsukiweb-common/utils/utils"
import { settings } from "../utils/settings"

type SettingsKey = keyof typeof settings

export const useConfig = <const K extends readonly SettingsKey[]>(keys: K) => {
	type Config = Pick<typeof settings, K[number]>

	const [conf, setConf] = useState<Config>(() => extract(settings, [...keys]) as Config)

	useEffect(() => {
		deepAssign(settings, conf as Record<string, any>)
	}, [conf])

	const update = <Key extends keyof Config>(key: Key, value: Config[Key]) => {
		setConf(prev => ({ ...prev, [key]: value }))
	}

	const reset = () => {
		const defaultConf = deepAssign(conf, settings.getReference()!, { extend: false, clone: true }) as Config
		setConf(defaultConf)
	}

	return { conf, setConf, update, reset }
}