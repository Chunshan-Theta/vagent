"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import App, { AppRef } from "../../../../class/[id]/App";
import { AgentConfig } from "../../../../types";
import { createAgentConfig } from "../../../../class/utils";
import { useTranscript } from "../../../../contexts/TranscriptContext";

type TabType = "chat" | "config" | "autotest";

interface TestCase {
  id?: number;
  agent_id?: string;
  name: string;
  input_text: string;
  comparison_method: "contains" | "similar";
  expected_parameters: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_TEST_CASES: TestCase[] = [
  {
    name: "Greeting Test",
    input_text: "你好",
    comparison_method: "contains",
    expected_parameters: ["你好", "您好"]
  },
  {
    name: "Farewell Test", 
    input_text: "再見",
    comparison_method: "contains",
    expected_parameters: ["再見", "掰掰"]
  },
  {
    name: "Opinion Test",
    input_text: "你怎麼看",
    comparison_method: "similar",
    expected_parameters: ["我也不知道"]
  }
];

// Function to check similarity using LLM API
async function checkSimilarity(actualResponse: string, expectedParameters: string[]): Promise<{similar: boolean, reason: string}> {
  try {
    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一個測試評估專家。你需要判斷實際回應是否與預期參數相似，並提供詳細的評估原因。

請用以下格式回答：
相似度：[是/否]
原因：[詳細說明為什麼相似或不相似]

評估標準：
- 如果實際回應的含義與任何一個預期參數相似，相似度為"是"
- 如果實際回應與所有預期參數都不相似，相似度為"否"
- 相似性包括：同義詞、相近表達、相同意圖、語義相近等
- 原因要詳細說明具體的相似點或差異點`
          },
          {
            role: 'user',
            content: `實際回應：${actualResponse}

預期參數：${expectedParameters.join(', ')}

請判斷實際回應是否與預期參數相似，並提供詳細原因。`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const llmResponse = data.choices?.[0]?.message?.content?.trim();
    
    // Parse the response
    const similarityMatch = llmResponse.match(/相似度[：:]\s*(是|否)/);
    const reasonMatch = llmResponse.match(/原因[：:]\s*(.+)/);
    
    const similar = similarityMatch?.[1] === '是';
    const reason = reasonMatch?.[1] || llmResponse;
    
    return { similar, reason };
  } catch (error) {
    console.error('Error in similarity check:', error);
    return { similar: false, reason: `相似性檢查失敗: ${error}` };
  }
}

export default function TestPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>(DEFAULT_TEST_CASES);
  const [testResults, setTestResults] = useState<{input: string, output: string, passed: boolean, reason: string}[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isLoadingTestCases, setIsLoadingTestCases] = useState(false);
  const [isSavingTestCases, setIsSavingTestCases] = useState(false);
  const [isDeletingTestCase, setIsDeletingTestCase] = useState<number | null>(null);
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
    loadTestCases();
  }, [params.id]);

  const loadTestCases = async () => {
    if (!params.id) return;
    
    setIsLoadingTestCases(true);
    try {
      const response = await fetch(`/api/test_case?agent_id=${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch test cases');
      const data = await response.json();
      if (data.success && data.testCases.length > 0) {
        setTestCases(data.testCases);
      }
    } catch (error) {
      console.error('Error loading test cases:', error);
    } finally {
      setIsLoadingTestCases(false);
    }
  };

  const saveTestCases = async () => {
    if (!params.id) return;
    
    setIsSavingTestCases(true);
    try {
      // Filter out test cases without required fields
      const validTestCases = testCases.filter(tc => 
        tc.name && tc.input_text && tc.expected_parameters.length > 0
      );

      if (validTestCases.length === 0) {
        alert('Please add at least one valid test case');
        return;
      }

      // Separate new test cases from existing ones
      const newTestCases = validTestCases.filter(tc => !tc.id);
      const existingTestCases = validTestCases.filter(tc => tc.id);

      let success = true;
      let errorMessage = '';

      // Update existing test cases
      if (existingTestCases.length > 0) {
        const updateResponse = await fetch('/api/test_case/bulk', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updates: existingTestCases }),
        });

        if (!updateResponse.ok) {
          success = false;
          errorMessage = 'Failed to update existing test cases';
        }
      }

      // Create new test cases
      if (success && newTestCases.length > 0) {
        const testCasesWithAgentId = newTestCases.map(tc => ({
          ...tc,
          agent_id: params.id
        }));

        const createResponse = await fetch('/api/test_case/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ testCases: testCasesWithAgentId }),
        });

        if (!createResponse.ok) {
          success = false;
          errorMessage = 'Failed to create new test cases';
        }
      }

      if (success) {
        alert('Test cases saved successfully!');
        // Reload test cases to get the updated data with IDs
        await loadTestCases();
      } else {
        alert(`Failed to save test cases: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error saving test cases:', error);
      alert(`Error saving test cases: ${error}`);
    } finally {
      setIsSavingTestCases(false);
    }
  };

  const deleteTestCase = async (testCaseId: number) => {
    if (!testCaseId) {
      // If no ID, just remove from local state (for unsaved test cases)
      setTestCases(prev => prev.filter(tc => tc.id !== testCaseId));
      return;
    }
    
    setIsDeletingTestCase(testCaseId);
    try {
      const response = await fetch(`/api/test_case/${testCaseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete test case');
      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setTestCases(prev => prev.filter(tc => tc.id !== testCaseId));
      } else {
        alert(`Failed to delete test case: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting test case:', error);
      alert(`Error deleting test case: ${error}`);
    } finally {
      setIsDeletingTestCase(null);
    }
  };



  const runTests = async () => {
    if (!testAppRef.current || !agent) return;
    
    setIsRunningTests(true);
    setTestResults([]);
    
    for (const testCase of testCases) {
      if (!testCase.input_text.trim()) continue;
      
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
        await testAppRef.current.sendSimulatedUserMessage(testCase.input_text, {
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
          await new Promise(resolve => setTimeout(resolve, 2000));
          
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
        
        // Check if response matches expected output based on comparison method
        let passed = true;
        let reason = "";
        
        if (testCase.expected_parameters && testCase.expected_parameters.length > 0) {
          if (testCase.comparison_method === "contains") {
            const matchedParams = testCase.expected_parameters.filter((param: string) => assistantResponse.includes(param));
            passed = matchedParams.length > 0;
            reason = passed 
              ? `回應包含預期參數: ${matchedParams.join(', ')}`
              : `回應未包含任何預期參數: ${testCase.expected_parameters.join(', ')}`;
          } else if (testCase.comparison_method === "similar") {
            // Use LLM API to check similarity
            try {
              const similarityResult = await checkSimilarity(assistantResponse, testCase.expected_parameters);
              passed = similarityResult.similar;
              reason = similarityResult.reason;
            } catch (error) {
              console.error("Error checking similarity:", error);
              passed = false;
              reason = `相似性檢查失敗: ${error}`;
            }
          }
        } else {
          reason = "無預期參數，測試通過";
        }
        
        setTestResults(prev => [...prev, {
          input: testCase.input_text,
          output: assistantResponse || "No response received",
          passed,
          reason
        }]);
              } catch (error) {
          setTestResults(prev => [...prev, {
            input: testCase.input_text,
            output: `Error: ${error}`,
            passed: false,
            reason: `測試執行失敗: ${error}`
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
              <div className="space-y-2">
                {testCases.map((testCase, index) => (
                  <div key={index} className="flex gap-2 items-center p-2 border rounded">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">測試名稱</label>
                      <input
                        type="text"
                        placeholder="Test Name"
                        value={testCase.name}
                        onChange={(e) => {
                          const newTestCases = [...testCases];
                          newTestCases[index].name = e.target.value;
                          setTestCases(newTestCases);
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">測試輸入</label>
                      <input
                        type="text"
                        placeholder="Input"
                        value={testCase.input_text}
                        onChange={(e) => {
                          const newTestCases = [...testCases];
                          newTestCases[index].input_text = e.target.value;
                          setTestCases(newTestCases);
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">比對方式</label>
                      <select
                        value={testCase.comparison_method}
                        onChange={(e) => {
                          const newTestCases = [...testCases];
                          newTestCases[index].comparison_method = e.target.value as "contains" | "similar";
                          setTestCases(newTestCases);
                        }}
                        className="w-full p-1 border rounded text-sm"
                      >
                        <option value="contains">包含</option>
                        <option value="similar">相似</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">使用參數 (逗號分隔)</label>
                      <input
                        type="text"
                        placeholder="Parameters (comma separated)"
                        value={testCase.expected_parameters?.join(', ') || ''}
                        onChange={(e) => {
                          const newTestCases = [...testCases];
                          newTestCases[index].expected_parameters = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                          setTestCases(newTestCases);
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </div>

                    <button
                      onClick={() => deleteTestCase(testCase.id || 0)}
                      disabled={isDeletingTestCase === testCase.id}
                      className="px-2 py-1 bg-red-500 text-white rounded text-sm disabled:bg-gray-400"
                    >
                      {isDeletingTestCase === testCase.id ? 'Deleting...' : 'Remove'}
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setTestCases([...testCases, { name: '', input_text: '', comparison_method: 'contains', expected_parameters: [] }])}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Add Test Case
                </button>
                <button
                    onClick={saveTestCases}
                    disabled={isSavingTestCases}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:bg-gray-400"
                    style={{ marginLeft: '10px' }}
                  >
                    {isSavingTestCases ? 'Saving...' : 'Save'}
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
                        <div className="text-sm text-gray-700 mt-1">Reason: {result.reason}</div>
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