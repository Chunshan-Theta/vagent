"use client"
import React, { useEffect, useRef, useMemo, useState } from 'react'
import { ReportV1 } from '@/app/types/ai-report'
import Image from 'next/image'

const avatarImg1 = '/images/landbank/土銀_楊副_大笑.jpg'
const avatarImg2 = '/images/landbank/土銀_楊副_平和.jpg'
const avatarImg3 = '/images/landbank/土銀_楊副_生氣.jpg'


type GradingItem = ReportV1.GradingItem

type OReportProps = ReportV1.OReportProps

const gradingOrder: { [title: string]: number } = {
  解釋財富價值清晰度: 0,
  對話邏輯連貫性: 1,
  客戶情緒共鳴力: 2,
  疑慮精準回應能力: 3,
  數據說服力應用: 4,
  風險對比展示技巧: 5,
  案例增強信任度: 6,
  決策引導優化能力: 7
}

const gradingRule = {
  minContainScore: 5
}

function getPlayLogs(datas: any) {
  const m = datas.playLogs || {}
  const playLogs: Array<{ role: 'assistant' | 'user'; content: string }> = m['1'] || []
  return playLogs
}

export default function OReportContent(opts: OReportProps) {
  const conv = {}

  const [ready, setReady] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const radarCanvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)
  const [scoreStatistics, setScoreStatistics] = useState({ count: 0, avg: 0, sum: 0 })

  const datas = useMemo(() => ({}), [ready])
  const logs: any[] = useMemo(() => [], [ready])

  const user = useMemo(() => {
    return opts.user || {}
  }, [opts.user])

  const playLogsText = useMemo(() => {
    return opts.playLogText || ''
  }, [opts.playLogText])

  const adviceItems = useMemo(() => {
    // TODO
    const items = opts.adviceItems || []
    return items
  }, [opts.adviceItems])

  const grading = useMemo(() => {
    if (opts.rubric) {
      const gradingItems: GradingItem[] = opts.rubric.map((item) => ({
        title: item.criterion,
        score: item.score,
        reason: item.reason,
        type: '',
        typeId: 5,
        appendScore: 0
      }))
      let other = 100
      gradingItems.forEach((item) => {
        if (gradingOrder[item.title] === undefined) {
          gradingOrder[item.title] = other
          other++
        }
        item.score = item.score || 0
        if (item.score < 0) item.score = 0
        if (item.score > 100) item.score = 100
      })
      gradingItems.sort((a, b) => gradingOrder[a.title] - gradingOrder[b.title])
      return {
        gradingItems,
        gradingTitles: gradingItems.map((item) => item.title)
      }
    }
    return {
      gradingItems: [],
      gradingTitles: []
    }
  }, [opts.rubric])


  // 計算分數統計
  useEffect(() => {
    const items = grading.gradingItems
    const sum = items.reduce((sum, item) => sum + item.score, 0)
    const avg = items.length > 0 ? sum / items.length : 0
    setScoreStatistics({ count: items.length, avg, sum })
  }, [grading])

  const avatarImg = useMemo(() => {
    const avg = scoreStatistics.avg
    if (avg >= 70) return avatarImg1
    if (avg >= 20) return avatarImg2
    return avatarImg3
  }, [scoreStatistics])

  // 分欄
  const scoreColumns = useMemo(() => {
    const items = grading.gradingItems
    const mid = Math.ceil(items.length / 2)
    return [
      { key: 'left', items: items.slice(0, mid) },
      { key: 'right', items: items.slice(mid) }
    ]
  }, [grading])

  // 初始化雷達圖與動畫
  useEffect(() => {
    if (!ready) return
    let destroyed = false
    setLocalLoading(true)
    let retires = 0
    const maxRetries = 15
    // 用於收集 gsap 動畫物件
    const gsapAnimations: any[] = []
    let floatingLights: HTMLElement[] = []
    async function run() {
      const { Chart, gsap } = window as any
      console.log('[oreport] init')
      if (!gsap || !Chart) {
        if (retires > maxRetries) {
          console.log('[oreport] ready')
          setLocalLoading(false)
          return
        }
        retires++
        setTimeout(run, 1000)
        return
      }
      // window.alert('ready')
      console.log('[oreport] state', { destroyed, ready })
      if (destroyed) return
      // improvmentHoverEffect()
      initRadarChart()
      // animatePageLoad()
      setLocalLoading(false)
    }
    run().catch((e) => {
      window.alert('init error:' + e.message)
    })
    function improvmentHoverEffect() {
      if (!rootRef.current) return
      const { gsap } = window as any
      const items = rootRef.current.querySelectorAll('.improvement-item')
      items.forEach((item) => {
        item.addEventListener('mouseenter', () => {
          gsap.to(item, {
            x: 5,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            duration: 0.3,
            ease: 'power2.out'
          })
          gsap.to(item.querySelector('strong'), {
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out'
          })
          gsap.to(item.querySelector('.bullet'), {
            scale: 1.2,
            boxShadow: '0 0 12px rgba(255, 193, 7, 0.7)',
            duration: 0.3,
            ease: 'power2.out'
          })
        })
        item.addEventListener('mouseleave', () => {
          gsap.to(item, {
            x: 0,
            background: 'transparent',
            boxShadow: 'none',
            duration: 0.3,
            ease: 'power2.out'
          })
          gsap.to(item.querySelector('strong'), {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          })
          gsap.to(item.querySelector('.bullet'), {
            scale: 1,
            boxShadow: '0 0 10px rgba(255, 193, 7, 0.5)',
            duration: 0.3,
            ease: 'power2.out'
          })
        })
      })
      // 自動適應文本區域高度
      const textareas = rootRef.current.querySelectorAll('textarea:not(.conversation-textarea)')
      textareas.forEach((textarea: any) => {
        textarea.addEventListener('input', function () {
          textarea.style.height = 'auto'
          textarea.style.height = textarea.scrollHeight + 'px'
        })
      })
    }
    function initRadarChart() {
      if (!radarCanvasRef.current) return
      const { Chart } = window as any
      const ctx = radarCanvasRef.current.getContext('2d')
      if (!ctx) return
      // Chart 實例變數
      let chartInstance: any = null
      const createGradient = (ctx: any, startColor: string, endColor: string) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400)
        gradient.addColorStop(0, startColor)
        gradient.addColorStop(1, endColor)
        return gradient
      }
      const areaGradient = createGradient(ctx, 'rgba(255, 193, 7, 0.4)', 'rgba(255, 152, 0, 0.1)')
      const borderGradient = createGradient(ctx, '#ffc107', '#ff9800')
      const userData = {
        labels: grading.gradingTitles,
        datasets: [
          {
            label: '個人能力',
            data: grading.gradingItems.map((d) => d.score),
            backgroundColor: areaGradient,
            borderColor: borderGradient,
            borderWidth: 2,
            pointBackgroundColor: '#ffc107',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: '#ffc107',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointStyle: 'circle',
            borderJoinStyle: 'round'
          }
        ]
      }
      const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)', lineWidth: 1 },
            grid: { color: 'rgba(255, 255, 255, 0.1)', circular: true },
            pointLabels: {
              color: 'rgba(255, 255, 255, 0.7)',
              font: { size: 10, family: "'Noto Sans TC', sans-serif" },
              padding: 10
            },
            ticks: { display: false, backdropColor: 'transparent' },
            suggestedMin: 0,
            suggestedMax: 100,
            border: { color: 'rgba(255, 255, 255, 0.05)' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            align: 'center',
            labels: {
              color: 'rgba(255, 255, 255, 0.9)',
              boxWidth: 12,
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11, family: "'Noto Sans TC', sans-serif" }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleColor: '#fff',
            bodyColor: '#fff',
            titleFont: { size: 12, family: "'Noto Sans TC', sans-serif" },
            bodyFont: { size: 12, family: "'Noto Sans TC', sans-serif" },
            padding: 10,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            displayColors: true,
            caretSize: 5
          }
        },
        elements: { line: { tension: 0.2 } }
      }
      // 建立 Chart 實例
      chartInstance = new Chart(ctx, { type: 'radar', data: userData, options: radarOptions })
      // 卸載時銷毀 Chart
      chartRef.current = chartInstance
    }
    function animatePageLoad() {
      const { gsap } = window as any
      if (!gsap) return
      const tl = gsap.timeline()
      gsapAnimations.push(tl)
      tl.from('.profile-container', {
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      })
      tl.from(
        '.card',
        {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          stagger: 0.2
        },
        '-=0.4'
      )
      gsapAnimations.push(
        gsap.to('.card', {
          y: 5,
          duration: 2.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          stagger: 0.1
        })
      )
      // 背景效果
      for (let i = 0; i < 10; i++) {
        const light = document.createElement('div')
        light.className = 'floating-light'
        document.body.appendChild(light)
        floatingLights.push(light)
        const xPos = Math.random() * 100
        const yPos = Math.random() * 100
        const size = Math.random() * 10 + 5
        const duration = Math.random() * 20 + 10
        const delay = Math.random() * 5
        light.style.cssText = `
          position: absolute;
          left: ${xPos}%;
          top: ${yPos}%;
          width: ${size}px;
          height: ${size}px;
          background: radial-gradient(circle, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0) 70%);
          border-radius: 50%;
          filter: blur(5px);
          z-index: -1;
          pointer-events: none;
          opacity: 0;
        `
        gsapAnimations.push(
          gsap.to(light, {
            opacity: Math.random() * 0.3 + 0.1,
            scale: Math.random() * 1.5 + 1,
            duration: 2,
            delay,
            ease: 'power1.inOut',
            yoyo: true,
            repeat: -1
          })
        )
        gsapAnimations.push(
          gsap.to(light, {
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            duration,
            delay,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
          })
        )
      }
      gsapAnimations.push(
        gsap.to('.profile-image', {
          rotate: 5,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        })
      )
      gsapAnimations.push(
        gsap.from('.conversation-textarea', {
          opacity: 0,
          duration: 1,
          delay: 0.8,
          ease: 'power2.out'
        })
      )
    }

    console.log('[oreport] DEBUG', {
      grading,
      scoreStatistics,
      user,
      playLogsText,
      adviceItems
    })

    return () => {
      const { gsap } = window as any
      destroyed = true
      // 停止所有 gsap 動畫
      if (gsap && gsapAnimations.length) {
        gsapAnimations.forEach(anim => {
          if (anim && typeof anim.kill === 'function') anim.kill()
        })
      }
      // 移除背景光點
      floatingLights.forEach(light => {
        if (light.parentNode) light.parentNode.removeChild(light)
      })
      floatingLights = []
      // Chart.js 卸載
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [ready])

  useEffect(() => {
    setReady(true)
  }, [])

  return (
    <div ref={rootRef} className="container">
      {ready && (
        <>
          <div className="header">
            <div className="profile-container">
              <div className="profile-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarImg} alt="教練頭像" />
              </div>
              <div className="profile-info">
                <div className="profile-title">
                  <h2>理財教練365 - 房貸壽險異議處理訓練</h2>
                  <div className="profile-details">
                    {user.code && <span className="tag">管理編號: {user.code}</span>}
                    {user.jobTitle && <span className="tag">職位: {user.jobTitle}</span>}
                    {user.name && <span className="tag">名字: {user.name}</span>}
                  </div>
                  <div className="profile-details" style={{ marginTop: 16 }}>
                    <span className="tag">
                      教練綜合評分：{scoreStatistics.avg.toFixed(0)}分
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card-container">
            <div className="analysis-container">
              <div className="card">
                <div className="card-header">
                  <h3>能力雷達分析</h3>
                </div>
                <div className="analysis-content">
                  <div className="radar-chart-container">
                    <canvas ref={radarCanvasRef}></canvas>
                  </div>
                  <div className="improvement-section">
                    <h4>優先提升項目</h4>
                    <div className="improvement-content">
                      {adviceItems.map((item, i) => (
                        <div key={i} className="improvement-item">
                          <span className="bullet"></span>
                          <div className="improvement-text">
                            <p>{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="assessment-container">
              <div className="card">
                <div className="card-header">
                  <h3>專業能力評估</h3>
                </div>
                <div className="dimensions-grid">
                  {scoreColumns.map((column) => (
                    <div className="dimension-column" key={column.key}>
                      {column.items.map((item) => (
                        <div className="score-item" key={`${column.key}-${item.title}`}>
                          <div className="score-label" style={{ color: 'white' }}>
                            {item.title}
                          </div>
                          <div className="score-bar-container">
                            <div
                              className="score-bar"
                              data-score={item.score.toFixed(0)}
                              style={{ width: `${item.score}%` }}
                            >
                              {item.score > gradingRule.minContainScore && (
                                <div className="score-value">{item.score.toFixed(0)}</div>
                              )}
                            </div>
                            {item.score <= gradingRule.minContainScore && (
                              <div
                                className="score-value"
                                style={{
                                  position: 'relative',
                                  left: 6,
                                  top: 'calc(50% + 3px)',
                                  bottom: 0
                                }}
                              >
                                {item.score.toFixed(0)}
                              </div>
                            )}
                          </div>
                          <div className="score-description">
                            <textarea
                              value={item.reason || item.type}
                              placeholder="評分說明..."
                              readOnly
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="conversation-container">
              <div className="card">
                <div className="card-header">
                  <h3>客戶對話紀錄</h3>
                </div>
                <div className="conversation-content">
                  <div className="conversation-text-container">
                    <div className="conversation-text">
                      <textarea
                        value={playLogsText}
                        className="conversation-textarea"
                        placeholder="在此處粘貼或輸入對話紀錄..."
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}