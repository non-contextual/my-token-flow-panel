import ReactECharts from 'echarts-for-react'
import type { HourlyVolume } from '../types'

export default function VolumeTimeline({ buckets }: { buckets: HourlyVolume[] }) {
  if (buckets.length === 0) {
    return <div className="h-56 flex items-center justify-center text-muted text-sm font-mono">No data</div>
  }

  const labels = buckets.map((b) => {
    const d = new Date(b.hour)
    return buckets.length <= 48
      ? `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:00`
      : `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`
  })

  const fmtAmount = (v: number) => v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : v.toFixed(0)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1a2e',
      borderColor: '#2a2a40',
      textStyle: { color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 },
      formatter: (params: any[]) => {
        const p = params[0]
        const bucket = buckets[p.dataIndex]
        return `<b>${p.axisValueLabel}</b><br/>Volume: ${fmtAmount(bucket.totalAmount)} tokens<br/>Transfers: ${bucket.txCount}`
      },
    },
    grid: { left: 64, right: 16, top: 20, bottom: 40 },
    xAxis: {
      type: 'category', data: labels,
      axisLabel: { color: '#8888aa', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, rotate: buckets.length > 48 ? 30 : 0 },
      axisLine: { lineStyle: { color: '#1e1e30' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8888aa', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, formatter: fmtAmount },
      splitLine: { lineStyle: { color: '#1e1e30', type: 'dashed' } },
    },
    series: [{
      type: 'bar',
      data: buckets.map(b => b.totalAmount),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#4338ca' }],
        },
        borderRadius: [3, 3, 0, 0],
      },
    }],
  }

  return <ReactECharts option={option} style={{ height: '240px', width: '100%' }} opts={{ renderer: 'canvas' }} />
}
