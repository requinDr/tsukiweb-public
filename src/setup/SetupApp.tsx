import { FormEvent, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import {
  MdCheckCircle,
  MdDownload,
  MdError,
  MdFolder,
  MdInsertDriveFile,
  MdPending,
  MdPlayArrow,
  MdRefresh,
  MdSave,
} from 'react-icons/md'
import {
  Button,
  MessageContainer,
  PageSection,
  PageTabsLayout,
} from '@tsukiweb/common/ui-core'

type PipelineId = 'main' | 'pd'
type Failure = string | { target: string; state: string }

type StepState = {
  id: number
  title: string
  canRun: boolean
  done: boolean
  blockedBy: Failure[]
  incomplete: Failure[]
}

type SetupEvent = {
  id: number
  timestamp: string
  type: 'progress' | 'log' | 'error' | 'clear' | 'done' | 'step-started' | 'step-finished'
  text?: string
  key?: string
  pipeline?: PipelineId
  stepId?: number
  result?: 'success' | 'error' | 'incomplete'
}

type SetupState = {
  config: { WAIFU2X_CAFFE: string; FFMPEG: string; PUBLIC: string }
  running: { pipeline: PipelineId; stepId: number; title: string } | null
  lastResult: SetupEvent | null
  journal: SetupEvent[]
  tools: Array<{
    id: string
    label: string
    configuredValue: string
    found: boolean
    resolvedPath: string | null
    downloadUrl: string
  }>
  sources: Array<{
    id: string
    pipeline: PipelineId
    label: string
    path: string
    found: boolean
    optional: boolean
    kind: 'file' | 'directory'
  }>
  pipelines: Array<{
    id: PipelineId
    title: string
    steps: StepState[]
  }>
}

const tabs = [
  { label: 'Main game', value: 'main' },
  { label: 'Plus-Disc', value: 'pd' },
]

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const body = await response.json()
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`)
  return body
}

function failureText(failure: Failure): string {
  return typeof failure === 'string' ? failure : `${failure.target} is ${failure.state}`
}

function statusFor(step: StepState, pipeline: PipelineId, running: SetupState['running']) {
  if (running?.pipeline === pipeline && running.stepId === step.id) return 'running'
  if (step.done) return 'done'
  return step.canRun ? 'ready' : 'blocked'
}

function ToolStatus({ tool }: { tool?: SetupState['tools'][number] }) {
  if (!tool || tool.found) return null

  return (
    <Button href={tool.downloadUrl} target="_blank" rel="noreferrer">
      <MdDownload aria-hidden /> Download
    </Button>
  )
}

function SetupApp() {
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineId>('main')
  const [state, setState] = useState<SetupState>()
  const [journal, setJournal] = useState<SetupEvent[]>([])
  const [form, setForm] = useState<SetupState['config']>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    try {
      const next = await api<SetupState>('/api/setup/state')
      setState(next)
      setForm(next.config)
      setJournal(next.journal)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  useEffect(() => {
    void refresh()
    const events = new EventSource('/api/setup/events')
    events.onmessage = event => {
      const entry = JSON.parse(event.data) as SetupEvent
      setJournal(current => current.some(item => item.id === entry.id) ? current : [...current, entry].slice(-500))
      if (entry.type === 'step-started' || entry.type === 'step-finished') void refresh()
    }
    events.onerror = () => setError('Live log connection lost. Reconnecting…')
    events.onopen = () => setError('')
    return () => events.close()
  }, [])

  const pipeline = state?.pipelines.find(item => item.id === selectedPipeline)
  const sources = state?.sources.filter(source => source.pipeline === selectedPipeline) ?? []
  const ffmpeg = state?.tools.find(tool => tool.id === 'ffmpeg')
  const waifu2x = state?.tools.find(tool => tool.id === 'waifu2x')

  const visibleJournal = useMemo(() => {
    const lastClear = journal.findLastIndex(event => event.type === 'clear')
    const events = journal.slice(lastClear + 1)
    const permanent = events.filter(event => event.type === 'log' || event.type === 'error')
    const progress = new Map<string, SetupEvent>()
    for (const event of events) {
      if (event.type === 'progress') progress.set(event.key ?? 'progress', event)
    }
    return [...permanent, ...progress.values()]
  }, [journal])

  const saveConfig = async (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    setSaving(true)
    try {
      const next = await api<SetupState>('/api/setup/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setState(next)
      setForm(next.config)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setSaving(false)
    }
  }

  const runStep = async (step: StepState) => {
    try {
      const response = await api<{ running: NonNullable<SetupState['running']> }>('/api/setup/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: selectedPipeline, stepId: step.id }),
      })
      setState(current => current ? { ...current, running: response.running } : current)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
      await refresh()
    }
  }

  if (!state || !form || !pipeline) {
    return (
      <div className="setup-loading">
        <MdPending aria-hidden />
        <span>{error || 'Loading asset setup…'}</span>
        {error && <Button onClick={() => void refresh()}>Retry</Button>}
      </div>
    )
  }

  return (
    <div className="setup-page page">
      <PageTabsLayout
        id="setup-layout"
        title="Assets setup"
        tabs={tabs}
        selectedTab={selectedPipeline}
        setSelectedTab={setSelectedPipeline}
      >
        <PageSection className="setup-content">
          {error && <MessageContainer className="setup-error" role="alert"><MdError aria-hidden /> {error}</MessageContainer>}

          <section className="setup-panel" aria-labelledby="configuration-title">
            <form onSubmit={saveConfig} className="setup-form">
              <div className="config-list">
                <div className={classNames('config-row', { missing: !ffmpeg?.found })}>
                  {ffmpeg?.found ? <MdCheckCircle aria-hidden /> : <MdError aria-hidden />}
                  <label htmlFor="setup-ffmpeg">FFmpeg</label>
                  <input
                    id="setup-ffmpeg"
                    value={form.FFMPEG}
                    onChange={event => setForm({ ...form, FFMPEG: event.target.value })}
                    disabled={Boolean(state.running)}
                    required
                  />
                  <ToolStatus tool={ffmpeg} />
                </div>
                <div className={classNames('config-row', { missing: !waifu2x?.found })}>
                  {waifu2x?.found ? <MdCheckCircle aria-hidden /> : <MdError aria-hidden />}
                  <label htmlFor="setup-waifu2x">waifu2x-caffe</label>
                  <input
                    id="setup-waifu2x"
                    value={form.WAIFU2X_CAFFE}
                    onChange={event => setForm({ ...form, WAIFU2X_CAFFE: event.target.value })}
                    disabled={Boolean(state.running)}
                    required
                  />
                  <ToolStatus tool={waifu2x} />
                </div>
              </div>
              <div className="setup-form-actions">
                <Button variant="elevation" type="submit" disabled={saving || Boolean(state.running)}>
                  <MdSave aria-hidden /> {saving ? 'Saving…' : 'Save configuration'}
                </Button>
              </div>
            </form>
          </section>

          <section className="setup-panel" aria-labelledby="sources-title">
            <p className="source-base-path">Expected in <code>tools/</code></p>
            <div className="source-list">
              {sources.map(source => (
                <div key={source.id} className={classNames('source-card', { found: source.found, missing: !source.found })} title={source.path}>
                  {source.kind === 'directory' ? <MdFolder aria-hidden /> : <MdInsertDriveFile aria-hidden />}
                  <span className="source-label">{source.label}</span>
                  <span className="source-requirement">{source.optional ? 'Optional' : 'Required'}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="setup-panel" aria-labelledby="steps-title">
            <h2 id="steps-title">Generation steps</h2>
            <div className="step-list">
              {pipeline.steps.map(step => {
                const status = statusFor(step, selectedPipeline, state.running)
                const details = status === 'blocked' ? step.blockedBy : status === 'done' ? [] : step.incomplete
                return (
                  <article key={step.id} className={classNames('step-row', status)}>
                    {status === 'done' ? <MdCheckCircle aria-hidden /> : status === 'running' ? <MdPending aria-hidden /> : status === 'blocked' ? <MdError aria-hidden /> : <MdPlayArrow aria-hidden />}
                    <span className="source-label">{step.title}</span>
                    <small>{details.map(failureText).join(', ')}</small>
                    <Button
                      variant="select"
                      onClick={() => void runStep(step)}
                      disabled={Boolean(state.running) || !step.canRun}
                    >
                      {status === 'running' ? <MdPending aria-hidden /> : status === 'done' ? <MdRefresh aria-hidden /> : <MdPlayArrow aria-hidden />}
                      {status === 'running' ? 'Running…' : status === 'done' ? 'Run again' : 'Run'}
                    </Button>
                  </article>
                )
              })}
            </div>
            {visibleJournal.length > 0 && (
              <div className="setup-journal" role="log" aria-live="polite">
                {visibleJournal.map(event => (
                  <div key={event.id} className={classNames('journal-line', event.type)}>
                    <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
                    <span>{event.text}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </PageSection>
      </PageTabsLayout>
    </div>
  )
}

export default SetupApp
