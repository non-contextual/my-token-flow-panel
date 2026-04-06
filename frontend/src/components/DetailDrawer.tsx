import { useState, useEffect } from 'react'
import type { TokenFlow, AddressNode } from '../types'

export type DrawerTarget =
  | { type: 'node'; label: string; address: string }
  | { type: 'edge'; fromLabel: string; toLabel: string; fromFull: string; toFull: string }

interface Props {
  target: DrawerTarget | null
  flows: TokenFlow[]
  topAddresses: AddressNode[]
  onClose: () => void
}

// ── helpers ────────────────────────────────────────────────────────────────────

function fmtAmount(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(3)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(3)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(3)}K`
  return n.toFixed(4)
}

function fmtTime(ts: number): string {
  const d = new Date(ts * 1000)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

function shortAddr(addr: string): string {
  if (!addr || addr === 'Others' || addr.length < 8) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// 钱包行为特征标签：基于流量对称性、净流向比例、tx 数量
function walletTypeTag(node: AddressNode): { label: string; color: string } {
  const total = node.totalSent + node.totalReceived
  if (total === 0) return { label: 'No activity', color: 'text-muted' }

  const lo = Math.min(node.totalSent, node.totalReceived)
  const hi = Math.max(node.totalSent, node.totalReceived, 1)
  const symmetry = lo / hi

  if (symmetry > 0.4) return { label: 'Pool-like · bidirectional', color: 'text-[#6366f1]' }

  const netRatio = Math.abs(node.netFlow) / total
  if (node.txCount >= 30 && netRatio < 0.15) return { label: 'High-freq · balanced', color: 'text-slate-300' }
  if (total > 5e7) return { label: 'Whale · large volume', color: 'text-[#2dd4bf]' }
  if (node.txCount <= 2) return { label: 'Rare · few transactions', color: 'text-muted' }
  if (node.netFlow > 0 && netRatio > 0.5) return { label: 'Accumulator · net inflow', color: 'text-[#2dd4bf]' }
  if (node.netFlow < 0 && netRatio > 0.5) return { label: 'Distributor · net outflow', color: 'text-[#f97316]' }
  return { label: 'Mixed · balanced activity', color: 'text-slate-400' }
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500) }}
      className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted
                 hover:text-accent hover:bg-accent/10 transition-colors shrink-0"
    >
      {ok ? '✓' : 'copy'}
    </button>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────────

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-border/30">
      <span className="text-muted text-xs font-mono">{label}</span>
      <span className={`text-sm font-mono font-semibold ${color ?? 'text-slate-200'}`}>{value}</span>
    </div>
  )
}

function FlowRow({ flow, perspective }: { flow: TokenFlow; perspective?: string }) {
  const isOut    = perspective ? flow.fromAddress === perspective : false
  const dirColor = isOut ? 'text-[#f97316]' : 'text-[#2dd4bf]'
  const arrow    = isOut ? '→' : '←'

  return (
    <div className="py-2 border-b border-border/20 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
      {/* row 1: time + amount */}
      <span className="text-[10px] text-muted font-mono">{fmtTime(flow.timestamp)}</span>
      <span className={`text-xs font-mono font-semibold text-right ${dirColor}`}>
        {arrow} {fmtAmount(flow.amount)}
      </span>
      {/* row 2: from → to */}
      <span className="text-[11px] font-mono text-slate-400 truncate">
        {shortAddr(flow.fromAddress)} → {shortAddr(flow.toAddress)}
      </span>
      {/* row 3: source + solscan link */}
      <span className="text-[10px] text-muted text-right font-mono col-start-2">{flow.source}</span>
      <a
        href={`https://solscan.io/tx/${flow.signature}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-mono text-muted/50 hover:text-accent transition-colors truncate"
        title={flow.signature}
      >
        {flow.signature.slice(0, 8)}…
      </a>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

export default function DetailDrawer({ target, flows, topAddresses, onClose }: Props) {
  const open = target !== null

  // Esc 键关闭抽屉
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 z-20 bg-black/40 transition-opacity duration-200
                    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* drawer */}
      <div
        className={`fixed top-0 right-0 z-30 h-full w-[400px] max-w-full
                    bg-card border-l border-border shadow-2xl
                    flex flex-col transition-transform duration-250 ease-out
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {open && target && (
          target.type === 'node'
            ? <NodePanel target={target} flows={flows} topAddresses={topAddresses} onClose={onClose} />
            : <EdgePanel target={target} flows={flows} onClose={onClose} />
        )}
      </div>
    </>
  )
}

// ── NodePanel ──────────────────────────────────────────────────────────────────

function NodePanel({ target, flows, topAddresses, onClose }: {
  target: Extract<DrawerTarget, { type: 'node' }>
  flows: TokenFlow[]
  topAddresses: AddressNode[]
  onClose: () => void
}) {
  const node = topAddresses.find(a => a.address === target.address)
  const tag  = node ? walletTypeTag(node) : null

  const related = flows
    .filter(f => f.fromAddress === target.address || f.toAddress === target.address)
    .sort((a, b) => b.timestamp - a.timestamp)

  const noFlows = flows.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <p className="text-[10px] text-muted font-mono uppercase tracking-wider mb-1">Address Detail</p>
          <div className="flex items-center gap-1">
            <span className="text-sm font-mono text-slate-200 truncate">{target.label}</span>
            <CopyBtn text={target.address} />
          </div>
          <p className="text-[10px] font-mono text-muted mt-0.5 break-all leading-tight">
            {target.address}
          </p>
          {/* 钱包类型标签 */}
          {tag && (
            <p className={`text-[10px] font-mono mt-1.5 ${tag.color}`}>
              ◈ {tag.label}
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-muted hover:text-slate-200 ml-3 shrink-0 text-lg leading-none">✕</button>
      </div>

      {/* stats */}
      {node && (
        <div className="px-4 py-2 border-b border-border shrink-0">
          <StatRow label="Received"  value={fmtAmount(node.totalReceived)} color="text-[#2dd4bf]" />
          <StatRow label="Sent"      value={fmtAmount(node.totalSent)}     color="text-[#f97316]" />
          <StatRow
            label="Net Flow"
            value={(node.netFlow >= 0 ? '+' : '') + fmtAmount(node.netFlow)}
            color={node.netFlow >= 0 ? 'text-[#2dd4bf]' : 'text-[#f97316]'}
          />
          <StatRow label="Transfers" value={String(node.txCount)} />
        </div>
      )}

      {/* history */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <p className="text-[10px] text-muted font-mono uppercase tracking-wider mb-2">
          Transfer History {related.length > 0 ? `(${related.length})` : ''}
        </p>

        {noFlows && (
          <p className="text-muted text-xs font-mono py-4 text-center">
            Re-fetch to load individual transactions
          </p>
        )}

        {!noFlows && related.length === 0 && (
          <p className="text-muted text-xs font-mono py-4 text-center">No transfers found</p>
        )}

        {related.map((f, i) => (
          <FlowRow key={i} flow={f} perspective={target.address} />
        ))}
      </div>
    </div>
  )
}

// ── EdgePanel ──────────────────────────────────────────────────────────────────

function EdgePanel({ target, flows, onClose }: {
  target: Extract<DrawerTarget, { type: 'edge' }>
  flows: TokenFlow[]
  onClose: () => void
}) {
  const { fromFull, toFull, fromLabel, toLabel } = target
  const isOthers = fromFull === 'Others' || toFull === 'Others'

  const related = flows
    .filter(f =>
      (f.fromAddress === fromFull && f.toAddress === toFull) ||
      (f.fromAddress === toFull   && f.toAddress === fromFull)
    )
    .sort((a, b) => b.timestamp - a.timestamp)

  const fwdVol = related.filter(f => f.fromAddress === fromFull).reduce((s, f) => s + f.amount, 0)
  const revVol = related.filter(f => f.fromAddress === toFull).reduce((s, f) => s + f.amount, 0)
  const net    = fwdVol - revVol

  const noFlows = flows.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <p className="text-[10px] text-muted font-mono uppercase tracking-wider mb-1">Flow Detail</p>
          <div className="flex items-center gap-1 text-sm font-mono text-slate-200">
            <span className="text-[#2dd4bf]">{fromLabel}</span>
            <span className="text-muted mx-1">→</span>
            <span className="text-[#f97316]">{toLabel}</span>
          </div>
          {!isOthers && (
            <div className="mt-1 space-y-0.5">
              <div className="flex items-center">
                <span className="text-[10px] font-mono text-muted truncate">{fromFull}</span>
                <CopyBtn text={fromFull} />
              </div>
              <div className="flex items-center">
                <span className="text-[10px] font-mono text-muted truncate">{toFull}</span>
                <CopyBtn text={toFull} />
              </div>
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-muted hover:text-slate-200 ml-3 shrink-0 text-lg leading-none">✕</button>
      </div>

      {/* stats */}
      {!noFlows && related.length > 0 && (
        <div className="px-4 py-2 border-b border-border shrink-0">
          <StatRow label={`${fromLabel} → ${toLabel}`} value={fmtAmount(fwdVol)} color="text-[#2dd4bf]" />
          {revVol > 0 && (
            <StatRow label={`${toLabel} → ${fromLabel}`} value={fmtAmount(revVol)} color="text-[#f97316]" />
          )}
          <StatRow
            label="Net"
            value={(net >= 0 ? '+' : '') + fmtAmount(net) + (net >= 0 ? ` (${fromLabel})` : ` (${toLabel})`)}
            color={net >= 0 ? 'text-[#2dd4bf]' : 'text-[#f97316]'}
          />
          <StatRow label="Transfers" value={String(related.length)} />
        </div>
      )}

      {/* history */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <p className="text-[10px] text-muted font-mono uppercase tracking-wider mb-2">
          Transfer History {related.length > 0 ? `(${related.length})` : ''}
        </p>

        {noFlows && (
          <p className="text-muted text-xs font-mono py-4 text-center">
            Re-fetch to load individual transactions
          </p>
        )}

        {!noFlows && related.length === 0 && (
          <p className="text-muted text-xs font-mono py-4 text-center">No transfers found</p>
        )}

        {related.map((f, i) => (
          <FlowRow key={i} flow={f} />
        ))}
      </div>
    </div>
  )
}
