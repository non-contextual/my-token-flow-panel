import type { FlowData } from '../types'
import StatsCards from './StatsCards'
import VolumeTimeline from './VolumeTimeline'
import FlowSankey from './FlowSankey'
import TopAddresses from './TopAddresses'

interface Props {
  data: FlowData
  onBack?: () => void
}

export default function Dashboard({ data, onBack }: Props) {
  const { meta } = data
  const fetchedAt = new Date(meta.fetchedAt).toLocaleString()

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-surface/90 backdrop-blur">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-muted hover:text-slate-200 font-mono text-xs transition-colors"
              >
                ← New
              </button>
            )}
            <span className="text-accent font-mono font-semibold text-sm tracking-wider uppercase">
              Sol Token Flow
            </span>
            <span className="font-mono text-xs text-muted" title={meta.mint}>
              {meta.mint}
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-muted">
            <span>last <span className="text-slate-300">{meta.days}d</span></span>
            <span>updated <span className="text-slate-300">{fetchedAt}</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <StatsCards data={data} />

        {/* Flow Sankey — 主图 */}
        <section className="card">
          <h2 className="label mb-1">Token Flow Graph</h2>
          <p className="text-muted text-xs font-mono mb-4">
            Each node is an address · Edge width = token volume · Drag nodes to rearrange
          </p>
          <FlowSankey edges={data.edges} topAddresses={data.topAddresses} />
        </section>

        {/* Volume timeline */}
        <section className="card">
          <h2 className="label mb-4">Transfer Volume (tokens / hour)</h2>
          <VolumeTimeline buckets={data.hourlyVolume} />
        </section>

        {/* Top addresses */}
        <section className="card">
          <h2 className="label mb-4">Top Addresses by Volume</h2>
          <TopAddresses addresses={data.topAddresses} />
        </section>
      </main>

      <footer className="border-t border-border mt-8 py-4 text-center text-muted text-xs font-mono">
        {meta.totalTxns} txns · {meta.totalFlows} token flows · via{' '}
        <span className="text-accent">Helius</span>
      </footer>
    </div>
  )
}
