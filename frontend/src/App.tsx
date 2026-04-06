import { useState } from 'react'
import type { FlowData } from './types'
import FetchForm from './components/FetchForm'
import Dashboard from './components/Dashboard'

type AppState = 'form' | 'fetching' | 'done'

export default function App() {
  const [state, setState] = useState<AppState>('form')
  const [data, setData] = useState<FlowData | null>(null)

  function handleDone(flowData: FlowData) {
    setData(flowData)
    setState('done')
  }

  function handleReset() {
    setData(null)
    setState('form')
  }

  if (state === 'done' && data) {
    return <Dashboard data={data} onBack={handleReset} />
  }

  return (
    <FetchForm
      onFetching={() => setState('fetching')}
      onDone={handleDone}
    />
  )
}
