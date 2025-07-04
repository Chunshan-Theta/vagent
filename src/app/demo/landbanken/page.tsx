'use client';

import React, { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { TranscriptProvider, useTranscript } from "@/app/contexts/TranscriptContext";
import { ChatProvider, useChat } from "@/app/contexts/ChatContext";
import { EventProvider } from "@/app/contexts/EventContext";
import App, { AppRef } from "./App";
import { useRouter } from "next/navigation";

import ChatView from "@/app/components/chat/ChatView";
import { AppProvider, useAppContext } from "@/app/contexts/AppContext";

import { v4 as uuidv4 } from "uuid";

import { useAiChat } from "@/app/lib/ai-chat/aiChat";

import AskForm from "@/app/components/AskForm";
import { delay } from "@/app/lib/utils";

function LandbankChatPage() {
  const {
    router,

    inputText,
    updateInputText,
    addTranscriptMessage,
    sendSimulatedUserMessage,
    isPTTUserSpeaking,
    canInterrupt,
    handleMicrophoneClick,
    handleTalkOn,
    transcriptItems,
    setIsAnalyzing,
    setIsCallEnded,
    isCallEnded,
    isAnalyzing,
    setAnalysisProgress,
    appRef,

    progressTimerRef,

    setupAnalysisState,
    endConversation,
    handleTalkOff,
    waitPostTask,

    getChatHistoryText,
    getChatHistory,

    isLoading,

    onSessionOpen,
    onSessionResume,
    onSessionClose,

    showSystemToast
  } = useAiChat();


  useEffect(() => {
    document.title = 'Business Training Script';
    addTranscriptMessage(uuidv4().slice(0, 32), 'assistant', `💡 This exercise is a "Customer Dialogue Simulation" scenario. Please try to play the role of a consultant and see how you would respond to the customer's concerns!
      Here's the customer's basic information:
      👤 Ms. Wang's background:
      30 years old, married working professional
      Combined monthly household income: $12,000 (with spouse)
      Monthly expenses include:
      🏠 Mortgage: Taoyuan Zhonglu District, $800,000 loan, monthly payment $28,678
      🎓 Children's education: Two children, monthly cost $30,000
      🛒 Household expenses (food, clothing, transportation, entertainment, insurance, etc.): About $30,000 monthly
      ❤️ Parental support: $5,000 monthly
      💬 Ms. Wang's concern: "The insurance premium is too expensive, will this leave us with no money to use?"
      
      `);
    addTranscriptMessage(uuidv4().slice(0, 32), 'assistant', `🎯 Your task:
      Please try to use professional explanations to help Ms. Wang clarify her concerns, help her understand the value of this insurance policy, and work together to find the most suitable solution, thereby increasing her willingness to purchase.
      This exercise simulates real dialogue with instant feedback to help strengthen your customer communication and persuasion skills!
      
      I will now act as 'Ms. Wang' for your practice.
      `);
  }, []);
  const [localLoading, setLocalLoading] = useState(false);
  const loading = useMemo(() => {
    return localLoading || isLoading || isAnalyzing;
  }, [localLoading, isLoading, isAnalyzing])
  useEffect(() => {
    console.log('[deltaww] loading', loading);
  }, [loading])
  // styles start
  const [pageBackground] = useState("linear-gradient(135deg, rgb(26, 42, 52) 0%, rgb(46, 74, 63) 100%)");
  const [chatBackground] = useState("linear-gradient(rgb(46, 74, 63) 0%, rgb(26, 42, 52) 100%)")

  const [scene, setScene] = useState("init");
  const askItems = useRef([
    {
      type: 'text' as const,
      title: 'Please enter your name',
      name: 'name',
      defaultValue: '',
    },
  ])


  // 分析並移動到報告頁面
  const handleAnalyzeChatHistory = async () => {
    if (transcriptItems.length === 0) {
      alert("No chat history available to analyze");
      return;
    }
    if (!canInterrupt) {
      showSystemToast('wait_for_response');
      return;
    }

    setupAnalysisState(0);
    await handleTalkOff();
    await delay(700); // 等待幾秒，確保對話結束
    await waitPostTask();
    await delay(700); // 等待幾秒，確保對話結束
    endConversation();

    // Start a timer to increment progress over time
    progressTimerRef.current = setInterval(() => {
      setAnalysisProgress(prev => {
        // Cap at 95% until we get the actual result
        if (prev < 95) {
          return prev + 0.3;
        }
        return prev;
      });
    }, 300); // Increment every 300ms


    const chatHistory = getChatHistoryText()

    try {
      setAnalysisProgress(30);

      // Perform analysis here before redirecting
      const criteria = `
Rating Criteria Title 1: Explain Wealth Value in Simple Terms
Excellent: Uses strong visual metaphors (like "financial safety cushion"), specifically describes how insurance absorbs mortgage pressure during accidents, mentions protection targets (like family), with vivid and concrete scenarios.
Good: Uses simple metaphors (like "safety cushion"), points out key insurance functions, but descriptions are brief without detailed elaboration.
Average: Plain text, only generally mentions protection functions, lacks specific imagery or appeal.
Poor: Abstract language (like "avoiding risks"), no specific scenarios, difficult to resonate with clients.
Cannot Judge: Not mentioned or cannot be determined.
---
Rating Criteria Title 2: Organize Dialogue Logic to Build Client Confidence
Excellent: First confirms client concerns (like "premium too high"), then explains reasons and connects to actual scenarios (mortgage pressure), finally proposes specific and flexible solutions, with smooth logic.
Good: Responds to concerns and provides solutions, but explanation is brief, not fully developed.
Average: Direct response but lacks layering, only mentions plan adjustments, doesn't show complete logic.
Poor: Scattered responses, no clear structure, even appears perfunctory, difficult to establish professionalism.
Cannot Judge: Not mentioned or cannot be determined.
---
Rating Criteria Title 3: Respond to Client Emotions to Build Trust
Excellent: Specifically points out client life pressures (like "mortgage, tuition"), shows deep understanding, naturally transitions to protection suggestions, strong emotional resonance.
Good: Acknowledges client emotions (like "careful budgeting"), but doesn't expand on specific scenarios, understanding feels weak.
Average: General response to client thoughts, lacks targeted details, insufficient emotional connection.
Poor: Ignores or belittles client emotions (like "not a big deal"), may cause resentment.
Cannot Judge: Not mentioned or cannot be determined.
---
Rating Criteria Title 4: Provide Precise Solutions for Client Concerns
Excellent: Addresses concerns (like "short-term financial pressure") with specific solutions (like "incremental premium"), includes numerical details and seeks opinions, strong problem-solving ability.
Good: Responds to concerns and gives direction (like "basic coverage"), but details aren't specific enough.
Average: General suggestions for plan adjustments, lacks targeted details, limited problem-solving.
Poor: Empty responses or overly confident (like "can't get lower"), fails to effectively address concerns.
Cannot Judge: Not mentioned or cannot be determined.
---
Rating Criteria Title 5: Use Data to Highlight Wealth Benefits
Excellent: Uses specific numbers (like "40 dollars daily" vs "500k mortgage"), explains in everyday terms (like "lunch money"), clear and attractive benefits.
Good: Provides numbers (like "15k vs 500k"), but doesn't break down to daily level, slightly weaker persuasion.
Average: Mentions premium and coverage relationship, but numbers are vague, lacks impact.
Poor: Vague numbers (like "a few thousand"), fails to effectively highlight benefits.
Cannot Judge: Not mentioned or cannot be determined.
---
Rating Criteria Title 6: Explain Risk Comparison to Highlight Coverage Advantages
Excellent: Detailed comparison of risks without insurance ("500k mortgage, 25k monthly") vs security with insurance, clear numbers with impact.
Good: Points out risk and coverage differences, but details aren't specific enough, slightly weaker impact.
Average: Generally mentions coverage function, vague risk description, difficult to move clients.
Poor: Unclear relationship between risk and coverage, empty expression, lacks persuasion.
Cannot Judge: Not mentioned or cannot be determined.
---
Rating Criteria Title 7: Share Success Stories to Enhance Persuasion
Excellent: Tells specific cases ("insured three years ago, 400k mortgage paid off"), rich details with emotional resonance.
Good: Mentions cases and points out effects, but lacks details, slightly weaker storytelling.
Average: Generally mentions others' experiences, no specific content, insufficient persuasion.
Poor: Only empty recommendations, no case support, difficult to build trust.
Cannot Judge: Not mentioned or cannot be determined.
---
Rating Criteria Title 8: Naturally Inquire About Willingness to Promote Wealth Planning
Excellent: Based on specific adjustments (like "40 dollars daily"), naturally seeks opinions (like "does this match your planning?"), smooth transition.
Good: Proposes adjustment and simply asks about willingness, natural tone but slightly weaker appeal.
Average: Directly asks for opinion, lacks guiding context, slightly abrupt.
Poor: Rushed tone or strong sales pressure (like "want to try?"), easily causes client resistance.
Cannot Judge: Not mentioned or cannot be determined.
`.trim().split('---').map(item => item.trim());

      const weights = [0.5, 0.5, 0.5, 0.5];

      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatHistory,
          rubric: {
            criteria,
            weights,
          },
          detectedLanguage: "en",
        }),
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        throw new Error('Failed to analyze conversation');
      }

      const analysisResult = await response.json();

      // Ensure the analysis result has the expected structure
      if (!analysisResult.scores || !analysisResult.overallScore || !analysisResult.feedback) {
        throw new Error('Invalid analysis result format');
      }

      // Ensure each score has the required fields
      analysisResult.scores.forEach((score: any) => {
        if (!score.examples) score.examples = [];
        if (!score.improvementTips) score.improvementTips = [];
      });

      // Ensure summary and overallImprovementTips exist
      if (!analysisResult.summary) analysisResult.summary = "No summary available.";
      if (!analysisResult.overallImprovementTips) analysisResult.overallImprovementTips = ["No improvement tips available."];

      // Ensure language field exists
      if (!analysisResult.language) analysisResult.language = "en";

      // Clear the progress timer
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      setAnalysisProgress(90);

      // Store the analysis result and chat history in localStorage
      localStorage.setItem('analysisResult', JSON.stringify(analysisResult));
      localStorage.setItem('chatHistory', chatHistory);
      localStorage.setItem('chatMessages', JSON.stringify(getChatHistory()));

      setAnalysisProgress(100);

      // Redirect to the analysis report page
      const back = encodeURIComponent('/demo/landbanken');
      router.push(`/demo/landbanken/report?back=${back}`);
    } catch (error) {
      // Clear the progress timer on error
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      console.error('Error analyzing conversation:', error);
      alert('Failed to analyze conversation. Please try again.');
      setIsAnalyzing(false);
    }
  };


  const onSubmitAskForm = (form: any) => {
    const datas = form.datas
    console.log('name:', datas.name)
    const name = (datas.name || '').trim()
    if (!name) {
      form.emitError('name', 'Please enter your name')
      return
    }

    setScene('chat');
  }
  // 等切換到 chat 之後要自動開 mic
  useEffect(() => {
    if (scene === 'chat') {
      handleTalkOn();
    }
  }, [scene])

  const onSubmitText = () => {
    sendSimulatedUserMessage(inputText, { hide: false, triggerResponse: true, interruptAI: true });
    updateInputText('');
  }


  function formScene() {
    const bgStyles = {
      background: 'linear-gradient(135deg, rgb(26, 42, 52) 0%, rgb(46, 74, 63) 100%)',
      minHeight: '100dvh',
      display: 'flex',
      justifyContent: 'center',
      paddingTop: '20vh',
    }
    return (
      <div style={bgStyles}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <AskForm
            items={askItems.current}
            submitText="Submit and Start"
            onSubmit={onSubmitAskForm}
            theme="landbank"
          ></AskForm>
        </div>
      </div>
    )
  }

  function chatScene() {
    return (
      <ChatView
        lang="en"
        classNames={['landbank']}
        background={chatBackground}
        isEnd={isCallEnded}
        isLoading={loading}
        isRecording={isPTTUserSpeaking}
        onSubmit={() => onSubmitText()}
        onClickEnd={() => handleAnalyzeChatHistory()}
        onMicrophoneClick={handleMicrophoneClick}
      ></ChatView>
    )
  }

  return (
    <div style={{ background: pageBackground }}>
      {
        scene === 'init' ? formScene()! :
          scene === 'chat' ? chatScene()! :
            <div>Unknown scene</div>
      }

      {/* App Component - properly initialized */}
      <div style={{ display: 'none' }}>
        <App
          ref={appRef}
          agentSetKey="landbankAgentEn"
          onSessionOpen={onSessionOpen}
          onSessionResume={onSessionResume}
          onSessionClose={onSessionClose}
        />
      </div>
    </div>
  );
}

// Use a client-only component to avoid hydration errors
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandbankChatPage />
    </Suspense>
  );
} 