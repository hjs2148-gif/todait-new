import assert from 'node:assert/strict'
import type { Task } from './logic.ts'
import { emptyState } from './model.ts'
import {
  bestDaySecBefore, bestStreak, bestWindow, dayTimeline, lastWeekSummary, mondayOf, weekTargets, chapterStartsOn, dayGoals, goalTotals, grassLevel, hourHeat, longestFocus, periodOf, planTotals, prevPeriod, subjectSplit, totalSec, weekdayAvg, weeklyGoalTrend,
} from './stats.ts'

const base: Task = {
  id: 'a', name: '수학', type: 'amount', kind: 'book', bookMode: 'amount', unit: '쪽', startPoint: 1, amount: 100, perDay: 0,
  startDate: '2026-11-01', endDate: '2026-11-30', week: [true, true, true, true, true, true, true], repeatEvery: null, supplementDow: null, custom: {},
  categoryId: 'c1', notifyTime: null, completed: false, completedDate: null, archived: false, order: 0, createdAt: 0,
}
const time: Task = { ...base, id: 'b', name: '풀이', type: 'time', kind: 'time', unit: '', startPoint: null, amount: 0, perDay: 3600, categoryId: 'c2', order: 1 }
const r = (expect: number, done: number, sec = 0) => ({ expect, done, sec, checked: false })
const s = {
  ...emptyState(),
  tasks: [base, time],
  recs: {
    a: { '2026-11-10': r(10, 10, 3600), '2026-11-11': r(10, 4, 1200), '2026-11-12': r(10, 0, 0) },
    b: { '2026-11-10': r(3600, 3600, 3600), '2026-11-11': r(3600, 1800, 1800) },
  },
}
const today = '2026-11-13'

// 목표 개수: 끝낸 것 / 전체
assert.deepEqual(dayGoals(s, '2026-11-10', today), { total: 2, done: 2 })
assert.deepEqual(dayGoals(s, '2026-11-11', today), { total: 2, done: 0 })
const p = { from: '2026-11-10', to: '2026-11-12', days: 3 }
const g = goalTotals(s, p, today)
assert.equal(g.total, 5) // 12일은 수학 목표만 있고 시간 목표는 없음
assert.equal(g.done, 2)

// 기간·지난 기간 비교
assert.deepEqual(periodOf('week', today, '2026-11-01'), { from: '2026-11-07', to: today, days: 7 })
assert.equal(periodOf('exam', today, '2026-11-01').days, 13)
assert.deepEqual(prevPeriod(p), { from: '2026-11-07', to: '2026-11-09', days: 3 })
assert.equal(totalSec(s, p), 3600 + 1200 + 3600 + 1800)

// 과목 비중
const split = subjectSplit(s, p)
assert.deepEqual(split.map((x) => [x.key, x.sec]), [['c2', 5400], ['c1', 4800]])

// 시간 기록: 가장 오래 / 집중 시간대 (시 경계에서 쪼갬)
const at = (d: string, h: number, m: number) => new Date(`${d.replace(/-/g, '/')} ${h}:${m}:00`).getTime()
const hs = [
  { id: '1', taskId: 'a', date: '2026-11-10', startedAt: at('2026-11-10', 21, 30), endedAt: at('2026-11-10', 22, 45) },
  { id: '2', taskId: 'b', date: '2026-11-11', startedAt: at('2026-11-11', 9, 0), endedAt: at('2026-11-11', 9, 20) },
]
const s2 = { ...s, histories: hs }
assert.deepEqual(longestFocus(s2, p).map((x) => [x.h.id, x.sec]), [['1', 4500], ['2', 1200]])
const heat = hourHeat(s2, p)
const wd = new Date('2026/11/10').getDay()
assert.equal(heat[wd][21], 30)
assert.equal(heat[wd][22], 45)
assert.equal(bestWindow(heat), 20) // 20~22시 구간이 가장 많음 (21시 30분 + 22시 45분)

// 요일별 평균, 잔디 단계, 연속
const avg = weekdayAvg(s, p)
assert.equal(avg[new Date('2026/11/10').getDay()], 7200)
assert.equal(grassLevel(0, 100), 0)
assert.equal(grassLevel(10, 100), 1)
assert.equal(grassLevel(100, 100), 4)
assert.equal(bestStreak(s, today, 600), 2)
assert.equal(bestStreak(s, today, 3100), 1)

// 계획별 합계: 쪽 / 시간
const pt = planTotals(s, p, today)
assert.deepEqual(pt.map((x) => [x.task.id, x.got, x.goal]), [['a', 14, 30], ['b', 5400, 7200]])

// 주간 목표 달성 추이 (기록 없는 주는 null)
const tr = weeklyGoalTrend(s, today, 3)
assert.equal(tr.length, 3)
assert.equal(tr[0], null)
assert.ok(tr[2] !== null && tr[2] > 0 && tr[2] < 1)

// 단원 시작 점
const toc: Task = { ...base, id: 'c', chapters: [{ id: 'x', name: '1', from: 1, to: 10 }, { id: 'y', name: '2', from: 11, to: 20 }] }
const s3 = { ...emptyState(), tasks: [toc], recs: { c: { '2026-11-02': r(10, 10), '2026-11-03': r(10, 5) } } }
assert.deepEqual(chapterStartsOn(s3, '2026-11-02').map((t) => t.id), ['c'])
assert.deepEqual(chapterStartsOn(s3, '2026-11-03').map((t) => t.id), ['c'])

// 하루 최고 기록, 월요일 계산
assert.equal(bestDaySecBefore(s, '2026-11-12', today), 7200)
assert.equal(bestDaySecBefore(s, '2026-11-10', today), 0)
assert.equal(mondayOf('2026-11-15'), '2026-11-09') // 일요일 → 그 주 월요일
assert.equal(mondayOf('2026-11-09'), '2026-11-09')

// 지난주 요약 (월요일 11/16에 11/9~15)
const lw = lastWeekSummary(s, '2026-11-16')
assert.equal(lw.period.from, '2026-11-09')
assert.equal(lw.period.to, '2026-11-15')
assert.equal(lw.sec, 3600 + 1200 + 3600 + 1800)
assert.deepEqual(lw.units, [{ unit: '쪽', n: 14 }])
assert.deepEqual(lw.missed, [{ unit: '쪽', n: 16 }]) // 11일 6쪽 + 12일 10쪽

// 이번 주 목표 (월요일에 보면 오늘 포함 7일)
const wt = weekTargets({ ...s, tasks: [{ ...base, endDate: '2026-11-30' }, time] }, '2026-11-16')
assert.equal(wt.length, 2)
assert.equal(wt[1].perDay, 3600)
assert.equal(wt[1].total, 7 * 3600)
assert.ok(wt[0].total > 0)

// 하루 타임라인: 6시~24시 사이 구간으로 환산
const tl = dayTimeline({ ...s, histories: hs }, '2026-11-10')
assert.equal(tl.length, 1)
assert.ok(Math.abs(tl[0].left - (15.5 / 18)) < 1e-9) // 21:30 → (21.5-6)/18
assert.ok(Math.abs(tl[0].width - 1.25 / 18) < 1e-9)

console.log('stats tests passed')
