'use client'

import React, { CSSProperties, useState, useMemo, useEffect, useRef } from 'react'
import OReportContent from './OReportContent'

import './oreport.scss'

type OReportProps = Parameters<typeof OReportContent>[0]

const OReportView: React.FC<OReportProps> = (props) => {
  const [loaded, setLoaded] = useState(0)

  const injectScripts = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.9/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
  ]

  const loadIndex = useRef(0)
  const addNextScript = () => {
    const nowIndex = loadIndex.current
    if (!injectScripts[nowIndex]) return
    const nextSrc = injectScripts[nowIndex]

    // add if not exist
    const existingScript = document.querySelector(`script[src="${nextSrc}"]`)
    if (existingScript) {
      setLoaded((prev) => prev + 1)
      setTimeout(() => {
        loadIndex.current += 1
        addNextScript()
      }, 1000)
      return
    }
    // console.log('add script', nowIndex, injectScripts.length, injectScripts[nowIndex])

    // console.log('start to load script', injectScripts[nowIndex])
    const nowScript = document.createElement('script')
    nowScript.src = nextSrc
    nowScript.onload = () => {
      // console.log('load script', injectScripts[nowIndex])
      setLoaded((prev) => prev + 1)
      setTimeout(() => {
        loadIndex.current += 1
        addNextScript()
      }, 1000)
    }
    document.head.appendChild(nowScript)
  }

  useEffect(() => {
    addNextScript()
  }, []);

  useEffect(() => {
    if (loaded >= injectScripts.length) {
      console.log('all scripts loaded')
      const root = document.documentElement
      root.style.setProperty('--background', '#173944')
    }
  }, [loaded])

  return (
    <div className="landbank-oreport">
      {loaded > injectScripts.length &&
        <OReportContent
          rubric={props.rubric}
          history={props.history}
          playLogText={props.playLogText}
          adviceItems={props.adviceItems}
          user={props.user}
        ></OReportContent>
      }
    </div>
  )
}

export default OReportView