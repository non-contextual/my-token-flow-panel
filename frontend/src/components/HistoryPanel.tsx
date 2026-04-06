import { useState, useEffect } from 'react'
import type { FlowData } from '../types'
import { loadLocalHistory, deleteFromLocalHistory, type LocalHistoryRecord } from '../utils/localHistory'

interface Props {
  refreshTrigger: number
  onLoad: (data: FlowData) => void
}

export default function HistoryPanel({ refreshTrigger, onLoad }: Props) {
  const [records, setRecords] = useState<LocalHistoryRecord[]>([])

  // 初次加载 + 每次爬取完成后刷新
  useEffect(() => {
    setRecords(loadLocalHistory())
  }, [refreshTrigger])

  function handleDelete(id: string) {
    deleteFromLocalHistory(id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  if (records.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label">Recent Fetches</span>
        <span className="text-xs font-mono text-muted">{records.length} saved locally</span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {records.map((record) => (
          <HistoryCard
            key={record.id}
            record={record}
            onLoad={() => onLoad(record.data)}
            onDelete={() => handleDelete(record.id)}
          />
        ))}
      </div>
    </div>
  )
}

function HistoryCard({
  record,
  onLoad,
  onDelete,
}: {
  record: LocalHistoryRecord
  onLoad: () => void
  onDelete: () => void
}) {
  const { meta } = record.data
  const date    = new Date(meta.fetchedAt)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div className="flex items-center gap-3 bg-surface border border-border rounded-lg px-3 py-2.5
                    hover:border-accent/40 transition-colors group">
      <div className="flex-1 min-w-0 space-y-0.5">
        <span
          className="font-mono text-xs text-slate-300 truncate block"
          title={meta.mint}
        >
          {meta.mint}
        </span>
        <div className="flex items-center gap-2 text-xs font-mono text-muted">
          <span className="text-accent">{meta.days}d</span>
          <span>·</span>
          <span className="text-buy">{meta.totalFlows.toLocaleString()} transfers</span>
          <span>·</span>
          <span>{dateStr} {timeStr}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onLoad}
          className="px-3 py-1 rounded text-xs font-mono bg-accent/10 text-accent
                     hover:bg-accent hover:text-white transition-colors"
        >
          Load
        </button>
        <button
          onClick={onDelete}
          className="px-2 py-1 rounded text-xs font-mono text-muted
                     hover:bg-sell/10 hover:text-sell transition-colors
                     opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
