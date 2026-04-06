import { useState, useEffect } from 'react'
import type { FlowData } from './types'
import FetchForm from './components/FetchForm'
import Dashboard from './components/Dashboard'

type AppState = 'form' | 'fetching' | 'done'

function getUrlParams(): { mint: string; days: number } {
  const p = new URLSearchParams(window.location.search)
  return {
    mint: p.get('mint') ?? '',
    days: parseInt(p.get('days') ?? '7', 10) || 7,
  }
}

function pushUrlState(mint: string, days: number) {
  const url = new URL(window.location.href)
  if (mint) {
    url.searchParams.set('mint', mint)
    url.searchParams.set('days', String(days))
  } else {
    url.searchParams.delete('mint')
    url.searchParams.delete('days')
  }
  window.history.replaceState(null, '', url.toString())
}

export default function App() {
  const [state, setState] = useState<AppState>('form')
  const [data, setData]   = useState<FlowData | null>(null)
  const [urlParams, setUrlParams] = useState<{ mint: string; days: number } | null>(null)

  // 页面加载时读取 URL 参数（供 FetchForm 预填）
  useEffect(() => {
    setUrlParams(getUrlParams())
  }, [])

  function handleDone(flowData: FlowData) {
    setData(flowData)
    setState('done')
    pushUrlState(flowData.meta.mint, flowData.meta.days)
  }

  function handleReset() {
    setData(null)
    setState('form')
    pushUrlState('', 7)
  }

  if (state === 'done' && data) {
    return <Dashboard data={data} onBack={handleReset} />
  }

  return (
    <FetchForm
      initialMint={urlParams?.mint ?? ''}
      initialDays={urlParams?.days ?? 7}
      onFetching={() => setState('fetching')}
      onDone={handleDone}
    />
  )
}
