import type { FlowData } from '../types'

const STORAGE_KEY = 'sol-token-flow-history'
const MAX_RECORDS = 8

export interface LocalHistoryRecord {
  id: string
  data: FlowData
}

/**
 * 保存一条爬取结果到 localStorage。
 * 保留最新 MAX_RECORDS 条，超出时自动丢弃最旧的。
 */
export function saveToLocalHistory(data: FlowData): string {
  const id = `${data.meta.mint}_${data.meta.days}d_${Date.now()}`
  // 先去掉同一 mint+days 的旧记录，避免 Load 时加载到过期数据
  const records = loadLocalHistory().filter(
    r => !(r.data.meta.mint === data.meta.mint && r.data.meta.days === data.meta.days)
  )
  const updated: LocalHistoryRecord[] = [{ id, data }, ...records].slice(0, MAX_RECORDS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    // QuotaExceededError：尝试只保存聚合数据（去掉原始 flows）
    try {
      const stripped = updated.map(r => ({ ...r, data: { ...r.data, flows: [] as FlowData['flows'] } }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped))
    } catch {
      console.warn('localStorage quota exceeded, history not saved')
    }
  }
  return id
}

/** 读取所有本地历史记录（按时间倒序） */
export function loadLocalHistory(): LocalHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 删除指定 id 的历史记录 */
export function deleteFromLocalHistory(id: string): void {
  try {
    const records = loadLocalHistory().filter(r => r.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {}
}
