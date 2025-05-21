"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { startAIMission, getAIMissionList } from '@/app/lib/ai-mission/missionAnalysis'
import type { AIMission, FullMissionParamsDefine, MissionParamsDefine } from '@/app/s-lib/ai-analysis/types';

export default function Page() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const errors = useRef<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [missionList, setMissionList] = useState<Array<AIMission & { params: FullMissionParamsDefine[] }>>([]);
  const [missionId, setMissionId] = useState("landbank/sentiment"); // 新增 missionId 狀態

  /** 用戶輸入的內容 */
  const [missionParams, setMissionParams] = useState<{ [key: string]: any }>({});


  // 根據選擇的 missionId 找到對應的 mission 定義
  const selectedMission = useMemo(() => {
    return missionList.find(m => m.id === missionId);
  }, [missionId, missionList]);

  useEffect(() => {
    initMissions();
  }, []);

  function _runAnalyze(opts: any) {
    const { missionId, params, responseType, modelOptions } = opts;

    return startAIMission({
      missionId,
      params,
      responseType,
      modelOptions,
    })
      .catch((err: any) => {
        console.error('Error in analyze:', err);
        errors.current = [...errors.current, err];
        setErrorMsg(String(err));
        return null;
      });
  }

  async function initMissions() {
    setLoading(true);
    try {
      const missions = await getAIMissionList();
      setMissionList(missions.map((mission) => {
        const paramsDefine = mission.paramsDefine
        const params = paramsDefine ? Object.keys(paramsDefine).map((key) => {
          const param = paramsDefine[key];
          return {
            ...param,
            name: key,
          };
        }) : [];
        return {
          ...mission,
          params
        }
      }));
    } catch (e) {
      console.error('Error fetching mission list:', e);
      setErrorMsg('無法獲取任務列表');
    }
    setLoading(false);
  }


  // 當 missionId 變動時，重設 missionParams
  useEffect(() => {
    if (selectedMission && selectedMission.params) {
      const defaultParams: { [key: string]: any } = {};
      selectedMission.params.forEach((p: any) => {
        defaultParams[p.name] = p.default ?? "";
      });
      setMissionParams(defaultParams);
    } else {
      setMissionParams({});
    }
  }, [missionId, missionList]);

  // 處理 params 欄位變動
  const handleParamChange = (name: string, value: any) => {
    setMissionParams(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    // 將 textarea 內容也放進 params（如果有 history 欄位）
    const params = { ...missionParams };
    if ('history' in params) {
      params['history'] = text;
    }
    const sentimentP = _runAnalyze({
      missionId,
      params,
      responseType: 'json_schema',
    });
    const res = await sentimentP;
    setResult(res);
    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "#f0f2f5",
      }}
    >
      <div style={{ width: 400, marginBottom: 16 }}>
        <label htmlFor="missionId-input" style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>
          任務 MissionId
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={missionId}
            onChange={e => setMissionId(e.target.value)}
            style={{
              flex: 1,
              padding: 10,
              fontSize: 16,
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            <option value="">請選擇任務</option>
            {missionList.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.id}
              </option>
            ))}
          </select>
          <input
            id="missionId-input"
            type="text"
            value={missionId}
            onChange={e => setMissionId(e.target.value)}
            placeholder="請輸入 missionId"
            style={{
              flex: 2,
              padding: 10,
              fontSize: 16,
              borderRadius: 6,
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
      {/* 動態產生 params 欄位 */}
      {selectedMission && selectedMission.params && selectedMission.params.length > 0 && (
        <div style={{ width: 400, marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>參數設定</div>
          <form
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
            onSubmit={e => e.preventDefault()}
          >
            {selectedMission.params.map((param) => (
              <div key={param.name} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <label htmlFor={`param-${param.name}`} style={{ fontWeight: 400 }}>
                  {param.title || param.name}
                </label>
                {param.type === "number" ? (
                  <input
                    id={`param-${param.name}`}
                    type="number"
                    value={missionParams[param.name] ?? ""}
                    onChange={e => handleParamChange(param.name, e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={param.placeholder || ""}
                    style={{
                      padding: 8,
                      fontSize: 15,
                      borderRadius: 5,
                      border: "1px solid #ccc",
                      background: "#fff",
                    }}
                  />
                ) : param.type === "boolean" ? (
                  <select
                    id={`param-${param.name}`}
                    value={missionParams[param.name] === true ? "true" : missionParams[param.name] === false ? "false" : ""}
                    onChange={e => handleParamChange(param.name, e.target.value === "true")}
                    style={{
                      padding: 8,
                      fontSize: 15,
                      borderRadius: 5,
                      border: "1px solid #ccc",
                      background: "#fff",
                    }}
                  >
                    <option value="">請選擇</option>
                    <option value="true">是</option>
                    <option value="false">否</option>
                  </select>
                ) : param.type === "textarea" ? (
                  <textarea
                    id={`param-${param.name}`}
                    value={missionParams[param.name] ?? ""}
                    onChange={e => handleParamChange(param.name, e.target.value)}
                    placeholder={param.placeholder || ""}
                    style={{
                      padding: 8,
                      fontSize: 15,
                      borderRadius: 5,
                      border: "1px solid #ccc",
                      background: "#fff",
                      minHeight: 80,
                      resize: "vertical",
                    }}
                  />
                ) : (
                  <input
                    id={`param-${param.name}`}
                    type="text"
                    value={missionParams[param.name] ?? ""}
                    onChange={e => handleParamChange(param.name, e.target.value)}
                    placeholder={param.placeholder || ""}
                    style={{
                      padding: 8,
                      fontSize: 15,
                      borderRadius: 5,
                      border: "1px solid #ccc",
                      background: "#fff",
                    }}
                  />
                )}
                {param.description && (
                  <div style={{ fontSize: 13, color: "#888" }}>{param.description}</div>
                )}
              </div>
            ))}
          </form>
        </div>
      )}
      {/* <textarea
        style={{
          width: 400,
          height: 200,
          padding: 12,
          border: "1px solid #ccc",
          borderRadius: 8,
          fontSize: 16,
          resize: "vertical",
          boxShadow: "0 2px 8px #0001",
          background: "#fff",
        }}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="在此貼上對話紀錄"
      /> */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          marginTop: 16,
          padding: "8px 32px",
          fontSize: 16,
          borderRadius: 6,
          border: "none",
          background: loading ? "#aaa" : "#1677ff",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 1px 4px #0001",
          transition: "background 0.2s",
        }}
      >
        {loading ? "分析中..." : "分析"}
      </button>
      {errorMsg && (
        <div
          style={{
            color: "#d32f2f",
            marginTop: 8,
            background: "#fff0f0",
            padding: "8px 16px",
            borderRadius: 4,
            border: "1px solid #f8bbbc",
            width: 400,
            textAlign: "center",
          }}
        >
          {errorMsg}
        </div>
      )}
      {result && (
        <pre
          style={{
            marginTop: 16,
            background: "#fff",
            padding: 12,
            width: 400,
            overflow: "auto",
            borderRadius: 6,
            border: "1px solid #eee",
            boxShadow: "0 1px 4px #0001",
            fontSize: 15,
            color: "#333",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}