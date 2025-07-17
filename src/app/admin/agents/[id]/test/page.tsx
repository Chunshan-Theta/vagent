"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import App, { AppRef } from "../../../../class/[id]/App";
import { AgentConfig } from "../../../../types";
import { createAgentConfig } from "../../../../class/[id]/page";
import { useTranscript } from "../../../../contexts/TranscriptContext";

type TabType = "chat" | "config" | "autotest";

interface TestCase {
  input: string;
  expectedOutputContains?: string[];
  delay?: number;
}

const DEFAULT_TEST_CASES: TestCase[] = [
  {
    input: "你好",
    expectedOutputContains: ["你好", "您好"],
    delay: 1000
  },
  {
    input: "再見",
    expectedOutputContains: ["再見", "掰掰"],
    delay: 1000
  },

  {
    input: "你怎麼看",
    expectedOutputContains: ["我也不知道"],
    delay: 1000
  }
];

export default function TestPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>(DEFAULT_TEST_CASES);
  const [testResults, setTestResults] = useState<{input: string, output: string, passed: boolean}[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const testAppRef = useRef<AppRef>(null);
  const { transcriptItems } = useTranscript();

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      const data = await response.json();
      if (!data.success || !data.agent) {
        throw new Error('Invalid response format');
      }
      const agentConfig = await createAgentConfig(data.agent, 'zh');
      setAgent(agentConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent');
    }
  };

  useEffect(() => {
    fetchAgent();
  }, [params.id]);

  const runTests = async () => {
    if (!testAppRef.current || !agent) return;
    
    setIsRunningTests(true);
    setTestResults([]);
    
    for (const testCase of testCases) {
      if (!testCase.input.trim()) continue;
      
      try {
        // 每個測資都開新連線
        await testAppRef.current.connectToRealtime();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待連線穩定
        // 清空 transcript，確保只抓新 session 訊息
        testAppRef.current.clearTranscript();
        
        // 等 agent 打招呼
        let greeting = "";
        let greetingReceived = false;
        
        for (let i = 0; i < 40; i++) { // 最多等 20 秒
          await new Promise(resolve => setTimeout(resolve, 500));
          const items = testAppRef.current.getTranscriptItems();
          // 檢查任何 assistant 訊息，只要 status 是 DONE 就認為回應完成
          const assistantMessage = items.find(item => 
            item.role === 'assistant' && 
            item.status === 'DONE' && 
            item.title && 
            item.title.trim()
          );
          if (assistantMessage) {
            greeting = assistantMessage.title;
            greetingReceived = true;
            // 再多等一秒確保訊息完全穩定
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        }
        
        // 如果 20 秒內沒收到 greeting，主動發話觸發 agent 回應
        if (!greetingReceived) {
          console.log("Agent did not respond within 20 seconds, sending trigger message...");
          await testAppRef.current.sendSimulatedUserMessage("你好", {
            hide: false,
            role: 'user',
            triggerResponse: true
          });
          
          // 再等一次 greeting
          for (let i = 0; i < 40; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const items = testAppRef.current.getTranscriptItems();
            const assistantMessage = items.find(item => 
              item.role === 'assistant' && 
              item.status === 'DONE' && 
              item.title && 
              item.title.trim()
            );
            if (assistantMessage) {
              greeting = assistantMessage.title;
              greetingReceived = true;
              await new Promise(resolve => setTimeout(resolve, 1000));
              break;
            }
          }
        }
        
        if (!greetingReceived) {
          throw new Error("Agent did not respond even after trigger message");
        }
        
        // Get current transcript length before sending message
        const transcriptLengthBefore = testAppRef.current.getTranscriptItems().length;
        
        // Send test input
        await testAppRef.current.sendSimulatedUserMessage(testCase.input, {
          hide: false,
          role: 'user',
          triggerResponse: true
        });
        
        // Wait for response completion by monitoring transcript updates
        let assistantResponse = "";
        let attempts = 0;
        const maxAttempts = 40; // 20 seconds with 500ms intervals
        let lastTranscriptLength = transcriptLengthBefore;
        let stableCount = 0; // Count how many times transcript length stays the same
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
          
          // Get transcript items from the test App's context
          const appTranscriptItems = testAppRef.current.getTranscriptItems();
          const currentTranscriptLength = appTranscriptItems.length;
          
          // Check if transcript length is stable (no new items added)
          if (currentTranscriptLength === lastTranscriptLength) {
            stableCount++;
            // If transcript has been stable for 3 consecutive checks (1.5 seconds), 
            // and we have assistant messages, consider response complete
            if (stableCount >= 3) {
              const newAssistantMessages = appTranscriptItems
                .slice(transcriptLengthBefore)
                .filter(item => item.role === 'assistant' && item.title && item.title.trim())
                .map(item => item.title);
              
              if (newAssistantMessages.length > 0) {
                assistantResponse = newAssistantMessages[newAssistantMessages.length - 1] || "";
                break;
              }
            }
          } else {
            // Reset stable count when new items are added
            stableCount = 0;
            lastTranscriptLength = currentTranscriptLength;
          }
          
          // Also check for new assistant messages in case they appear
          const newAssistantMessages = appTranscriptItems
            .slice(transcriptLengthBefore)
            .filter(item => item.role === 'assistant' && item.title && item.title.trim())
            .map(item => item.title);
          
          if (newAssistantMessages.length > 0) {
            // Check if the latest message is still being updated (status might be IN_PROGRESS)
            const latestAssistantItem = appTranscriptItems
              .slice(transcriptLengthBefore)
              .filter(item => item.role === 'assistant')
              .pop();
            
            // If the latest assistant message is DONE, consider response complete
            if (latestAssistantItem && latestAssistantItem.status === 'DONE') {
              assistantResponse = newAssistantMessages[newAssistantMessages.length - 1] || "";
              break;
            }
          }
        }
        
        // If no response received, wait a bit more
        if (!assistantResponse) {
          await new Promise(resolve => setTimeout(resolve, testCase.delay || 2000));
          
          const appTranscriptItems = testAppRef.current.getTranscriptItems();
          const finalAssistantMessages = appTranscriptItems
            .slice(transcriptLengthBefore)
            .filter(item => item.role === 'assistant' && item.title && item.title.trim())
            .map(item => item.title);
          
          assistantResponse = finalAssistantMessages[finalAssistantMessages.length - 1] || "";
        }
        
        // 收到回覆後才斷線
        await testAppRef.current.disconnectFromRealtime();
        await new Promise(resolve => setTimeout(resolve, 500)); // 等待斷線
        
        // Check if response contains expected output
        const passed = testCase.expectedOutputContains && testCase.expectedOutputContains.length > 0 ? 
          testCase.expectedOutputContains.some(expected => assistantResponse.includes(expected)) :
          true;
        
        setTestResults(prev => [...prev, {
          input: testCase.input,
          output: assistantResponse || "No response received",
          passed
        }]);
      } catch (error) {
        setTestResults(prev => [...prev, {
          input: testCase.input,
          output: `Error: ${error}`,
          passed: false
        }]);
      }
    }
    
    setIsRunningTests(false);
  };

  const renderTabContent = () => {
    if (error) {
      return <div className="p-4 text-red-500">{error}</div>;
    }

    if (!agent) {
      return <div className="p-4">Loading...</div>;
    }

    switch (activeTab) {
      case "chat":
        return (
          <App 
            agentConfig={agent}
            onSessionOpen={() => {}}
            onSessionClose={() => {}}
            hideLogs={false}
          />
        );
      case "config":
        return (
          <div className="p-4">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(agent, null, 2)}
            </pre>
          </div>
        );
      case "autotest":
        return (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Test Cases</h3>
              <div className="space-y-2">
                {testCases.map((testCase, index) => (
                  <div key={index} className="flex gap-2 items-center p-2 border rounded">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Input"
                        value={testCase.input}
                        onChange={(e) => {
                          const newTestCases = [...testCases];
                          newTestCases[index].input = e.target.value;
                          setTestCases(newTestCases);
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Expected output (comma separated)"
                        value={testCase.expectedOutputContains?.join(', ') || ''}
                        onChange={(e) => {
                          const newTestCases = [...testCases];
                          newTestCases[index].expectedOutputContains = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                          setTestCases(newTestCases);
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        placeholder="Delay (ms)"
                        value={testCase.delay || 2000}
                        onChange={(e) => {
                          const newTestCases = [...testCases];
                          newTestCases[index].delay = parseInt(e.target.value) || 2000;
                          setTestCases(newTestCases);
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newTestCases = testCases.filter((_, i) => i !== index);
                        setTestCases(newTestCases);
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setTestCases([...testCases, { input: '', expectedOutputContains: [], delay: 2000 }])}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Add Test Case
                </button>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={runTests}
                  disabled={isRunningTests}
                  className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
                >
                  {isRunningTests ? 'Running Tests...' : 'Run Tests'}
                </button>
              </div>
              
              {testResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Test Results</h4>
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div key={index} className={`p-2 border rounded ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="font-medium">Input: {result.input}</div>
                        <div className="text-sm text-gray-600">Output: {result.output}</div>
                        <div className={`text-sm font-medium ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {result.passed ? '✓ PASSED' : '✗ FAILED'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4" style={{ display: 'none'}}>
              <h3 className="text-lg font-semibold mb-2">Chat Interface</h3>
              <App
                ref={testAppRef}
                agentConfig={agent}
                onSessionOpen={() => {}}
                onSessionClose={() => {}}
                onSessionResume={() => {
                  testAppRef.current?.sendSimulatedUserMessage("hi", { hide: true, triggerResponse: true, });
                }}
                hideLogs={false}
                isTestMode={true}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Test Agent Page</h1>
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("chat")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "chat"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab("config")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "config"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Config
              </button>
              <button
                onClick={() => setActiveTab("autotest")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "autotest"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Auto Test
              </button>
            </nav>
          </div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
} 