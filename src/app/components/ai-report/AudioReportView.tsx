'use client';

import { useState, useEffect } from 'react';
import { FaChartBar, FaLightbulb, FaComments, FaHistory, FaArrowLeft, FaStar, FaVolumeUp, FaPlay } from 'react-icons/fa';
import confetti from 'canvas-confetti';
import { AnalysisResponse, AudioTimelineData, AudioInfo, ReportDatas } from '@/app/types/ai-report/common';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Props {
  /**
   * 分析結果數據，可以是 AnalysisResponse 對象、AudioTimelineData 對象或 JSON 字符串
   */
  data: ReportDatas;
  onBack?: () => void;
  /**
   * 保存的聊天紀錄 ( 可以是 JSON 字符串或 Array<Message> )
   */
  message?: any[] | string;
}

export default function AudioReportView({ data, onBack, message = '' }: Props) {
  const [localAnalysis, setLocalAnalysis] = useState<AnalysisResponse | null>(null);
  const [audioTimelineData, setAudioTimelineData] = useState<AudioTimelineData | null>(null);
  const [localMessage, setLocalMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioTimeline, setIsAudioTimeline] = useState(false);

  function getStoredChatMessages() : string {
    if (typeof message === 'string' && message.trim() !== '') {
      return message
    }
    if (Array.isArray(message)) {
      return JSON.stringify(message);
    }
    if (typeof window === 'undefined') return '[]';
    return localStorage.getItem('chatMessages') || '[]';
  }
  function getStoredAnalysis() {
    if (data && typeof data === 'object') {
      return JSON.stringify(data);
    }
    if (typeof window === 'undefined') return '{}';
    return localStorage.getItem('analyzeChatHistoryByRubric');
  }

  // Helper function to parse audioInfo
  const parseAudioInfo = (audioInfoString: string): AudioInfo | null => {
    try {
      return JSON.parse(audioInfoString);
    } catch {
      return null;
    }
  };

  // Helper function to get emotion color
  const getEmotionColor = (emotion: string) => {
    const emotionColors: Record<string, string> = {
      'Positive': 'text-green-400',
      'Negative': 'text-red-400',
      'Neutral': 'text-gray-400',
      'Questioning': 'text-blue-400',
      'Reassuring': 'text-yellow-400',
      'Affirmative': 'text-green-300',
      'Amused': 'text-purple-400',
      '未標記': 'text-gray-500',
      '穩定中立': 'text-gray-300',
      'Empathetic': 'text-green-400',
      'Appreciative': 'text-green-300',
      'Hesitant': 'text-orange-400',
      'Assertive': 'text-blue-400',
      'Concerned': 'text-yellow-400',
      'Frustrated': 'text-red-400',
      'Authoritative': 'text-purple-400',
      'Helpful': 'text-green-300',
      'Aggressive': 'text-red-500',
      // New emotion tags
      'Lighthearted': 'text-pink-400',
      'Friendly': 'text-green-300',
      'Understanding': 'text-blue-300',
      'Acknowledging': 'text-teal-400',
      'Cooperative': 'text-green-400',
      'Suggestive': 'text-blue-400',
      'Accommodating': 'text-green-300',
      'Explanatory': 'text-blue-300',
      'Practical': 'text-gray-300',
      'Encouraging': 'text-green-400',
      'Considerate': 'text-green-300',
      'Responsible': 'text-blue-400',
      'Informative': 'text-cyan-400'
    };
    return emotionColors[emotion] || 'text-gray-400';
  };

  // Helper function to analyze audio timeline data
  const analyzeAudioTimeline = (timelineData: AudioTimelineData): AnalysisResponse => {
    const timeline = timelineData.timeline;
    const totalEmotions: Record<string, number> = {};
    const allProblems: string[] = [];
    const allAnalysis: string[] = [];
    let conversationLength = 0;

    // Define emotion polarity
    const positiveEmotions = [
      'Empathetic', 'Appreciative', 'Assertive', 'Helpful', 'Authoritative',
      'Lighthearted', 'Friendly', 'Understanding', 'Acknowledging', 'Cooperative', 'Accommodating', 
      'Encouraging', 'Considerate', 'Responsible', 'Informative', 'Reassuring', 'Positive'
    ];
    const negativeEmotions = ['Hesitant', 'Concerned', 'Frustrated', 'Aggressive','Anxious',"Desperate"];
    const neutralEmotions = ['Suggestive', 'Explanatory', 'Practical', 'Neutral', 'Questioning'];
    
    // keyEmotions 為總和正負相的字詞
    const keyEmotions = [...positiveEmotions, ...negativeEmotions, ...neutralEmotions];

    // Track processed audioInfo to avoid duplicates
    const processedAudioInfo = new Set<string>();
    
    timeline.forEach(conversation => {
      // Collect problems and analysis
      allProblems.push(...conversation.keyPoint.problems);
      allAnalysis.push(...conversation.analysis);

      // Parse audio info for emotion analysis (avoid duplicates)
      if (conversation.userAudio?.audioInfo && !processedAudioInfo.has(conversation.userAudio.audioInfo)) {
        processedAudioInfo.add(conversation.userAudio.audioInfo);
        const audioInfo = parseAudioInfo(conversation.userAudio.audioInfo);
        if (audioInfo) {
          conversationLength += audioInfo.emotions.length;
          audioInfo.emotions.forEach(emotion => {
            // Split emotions by comma and space
            const emotions = emotion.emotion.split(/[,\s]+/).filter(e => e.trim() !== '');
            emotions.forEach(singleEmotion => {
              const trimmedEmotion = singleEmotion.trim();
              if (keyEmotions.includes(trimmedEmotion)) {
                totalEmotions[trimmedEmotion] = (totalEmotions[trimmedEmotion] || 0) + 1;
              } else {
                console.log(`trimmedEmotion: ${trimmedEmotion}`);
                // Group others together but don't affect calculation
                totalEmotions['Others'] = (totalEmotions['Others'] || 0) + 1;
              }
            });
          });
        }
      }
    });

    // Calculate emotion counts and polarity scores
    const keyEmotionCount = keyEmotions.reduce((sum, emotion) => sum + (totalEmotions[emotion] || 0), 0);
    const positiveEmotionCount = positiveEmotions.reduce((sum, emotion) => sum + (totalEmotions[emotion] || 0), 0);
    const negativeEmotionCount = negativeEmotions.reduce((sum, emotion) => sum + (totalEmotions[emotion] || 0), 0);
    const totalEmotionCount = Object.values(totalEmotions).reduce((sum, count) => sum + count, 0);
    
    // Calculate polarity-weighted score (positive emotions add more value, negative emotions reduce value)
    const polarityScore = (positiveEmotionCount * 15) - (negativeEmotionCount * 5) + (keyEmotionCount * 5);
    const overallScore = Math.min(100, Math.max(0, polarityScore));

    return {
      overallScore,
      feedback: `基於對話中的情緒分析和交流模式，您的整體表現為 ${overallScore.toFixed(0)} 分。`,
      summary: `此次對話包含 ${timeline.length} 個時間段，涵蓋了 ${conversationLength} 個情緒標記的句子。關鍵情緒數量：${keyEmotionCount} 次（正面情緒：${positiveEmotionCount} 次，負面情緒：${negativeEmotionCount} 次），總情緒標記數量：${totalEmotionCount} 次。情緒分布：${Object.entries(totalEmotions).map(([emotion, count]) => `${emotion}(${count}次)`).join('、')}。`,
      overallImprovementTips: allAnalysis.slice(0, 5),
      scores: [
        {
          criterion: '語速掌控力',
          score: (() => {
            // 基於對話時間長度和情緒變化頻率計算
            const timeBasedScore = Math.min(40, 30 + Math.log(conversationLength + 1) * 8);
            const emotionStability = keyEmotionCount > 0 ? (positiveEmotionCount / keyEmotionCount) * 30 : 20;
            return Math.min(98, Math.max(25, timeBasedScore + emotionStability));
          })(),
          explanation: `基於 ${conversationLength} 句對話長度和情緒穩定度分析語速控制`,
          examples: timeline.flatMap(conv => conv.userSay ? [conv.userSay.substring(0, 50) + '...'] : []).slice(0, 2),
          improvementTips: ['注意說話速度，避免過快或過慢', '配合聽眾理解節奏調整語速']
        },
        {
          criterion: '音量穩定力',
          score: (() => {
            // 基於負面情緒波動和對話一致性
            const stabilityPenalty = negativeEmotionCount * 3;
            const consistencyBonus = timeline.length > 3 ? 15 : timeline.length * 5;
            return Math.min(98, Math.max(25, 70 - stabilityPenalty + consistencyBonus));
          })(),
          explanation: `基於 ${timeline.length} 個時間段的對話一致性和情緒波動分析`,
          examples: timeline.flatMap(conv => conv.userSay ? [conv.userSay.substring(0, 50) + '...'] : []).slice(0, 2),
          improvementTips: ['保持音量穩定，避免忽大忽小', '根據環境調整適當音量']
        },
        {
          criterion: '語音清晰力',
          score: (() => {
            // 基於句子平均長度和專業詞彙使用
            const avgSentenceLength = timeline.reduce((sum, conv) => sum + (conv.userSay?.length || 0), 0) / timeline.length;
            const clarityScore = avgSentenceLength > 50 ? 75 - (avgSentenceLength - 50) * 0.3 : 75;
            const positiveAdjustment = Math.min(15, positiveEmotionCount * 1.2);
            return Math.min(98, Math.max(25, clarityScore + positiveAdjustment));
          })(),
          explanation: `基於平均句長和表達清晰度評估`,
          examples: timeline.flatMap(conv => conv.userSay ? [conv.userSay.substring(0, 50) + '...'] : []).slice(0, 2),
          improvementTips: ['注意發音清晰，避免含糊不清', '重要詞彙要特別清楚表達']
        },
        {
          criterion: '停頓運用力',
          score: (() => {
            // 基於問號和標點符號的使用頻率
            const questionCount = timeline.reduce((count, conv) => 
              count + (conv.userSay?.split('?').length - 1 || 0), 0);
            const pauseSkill = questionCount > 0 ? 60 + questionCount * 8 : 45;
            const emotionBalance = (positiveEmotionCount - negativeEmotionCount) * 2;
            return Math.min(98, Math.max(25, pauseSkill + emotionBalance));
          })(),
          explanation: `基於提問技巧和語句結構分析停頓運用`,
          examples: timeline.flatMap(conv => conv.userSay ? [conv.userSay.substring(0, 50) + '...'] : []).slice(0, 2),
          improvementTips: ['善用停頓幫助理解', '避免不必要的停頓造成卡頓感']
        },
        {
          criterion: '口語流暢力',
          score: (() => {
            // 直接基於問題數量計算，問題越多扣分越多
            const problemPenalty = allProblems.length * 2;
            const baseScore = 98;
            const emotionBonus = Math.min(10, (positiveEmotionCount*1.5 - negativeEmotionCount*0.5));
            return Math.min(98, Math.max(25, baseScore - problemPenalty*0.5 + emotionBonus));
          })(),
          explanation: `發現 ${allProblems.length} 個流暢性問題，影響流暢度評分`,
          examples: allProblems.slice(0, 2),
          improvementTips: ['保持自然流暢的表達', '減少不必要的重複和停頓']
        },
        {
          criterion: '說話簡潔力',
          score: (() => {
            // 基於平均回應長度和重複詞彙
            const totalLength = timeline.reduce((sum, conv) => sum + (conv.userSay?.length || 0), 0);
            const avgLength = totalLength / timeline.length;
            const conciseScore = avgLength < 80 ? 80 : Math.max(40, 120 - avgLength * 0.5);
            const problemAdjustment = allProblems.length * -0.5;
            return Math.min(98, Math.max(65, conciseScore + problemAdjustment));
          })(),
          explanation: `基於平均回應長度和表達精準度評估`,
          examples: timeline.flatMap(conv => conv.userSay && conv.userSay.length > 100 ? [conv.userSay.substring(0, 60) + '...'] : []).slice(0, 2),
          improvementTips: ['避免重複用詞', '表達要精準俐落']
        },
        {
          criterion: '重點傳達力',
          score: (() => {
            // 基於關鍵詞使用和強調語句
            const emphasisWords = timeline.reduce((count, conv) => {
              const emphasisPatterns = /[!！]{1,3}|[。]{2,}|[重要|關鍵|必須|一定]/g;
              return count + (conv.userSay?.match(emphasisPatterns)?.length || 0);
            }, 0);
            const emphasisScore = 50 + emphasisWords * 5;
            const emotionBonus = positiveEmotionCount * 1.5;
            return Math.min(98, Math.max(25, emphasisScore + emotionBonus));
          })(),
          explanation: `基於重點強調技巧和語氣運用評估`,
          examples: timeline.flatMap(conv => conv.userSay ? [conv.userSay.substring(0, 50) + '...'] : []).slice(0, 2),
          improvementTips: ['在關鍵詞句上加強語氣', '提升說服力與引導力']
        },
        {
          criterion: '語調表達力',
          score: (() => {
            // 基於情緒多樣性計算語調豐富度
            const emotionVariety = Object.keys(totalEmotions).filter(emotion => emotion !== 'Others').length;
            const varietyScore = Math.min(40, emotionVariety * 4);
            const intensityScore = keyEmotionCount > 0 ? Math.min(35, keyEmotionCount * 2.5) : 0;
            const baseScore = 25;
            return Math.min(98, Math.max(25, baseScore + varietyScore + intensityScore));
          })(),
          explanation: `基於 ${Object.keys(totalEmotions).filter(e => e !== 'Others').length} 種情緒類型的語調豐富度評估`,
          examples: timeline
            .filter(conv => conv.userAudio?.audioInfo)
            .map(conv => parseAudioInfo(conv.userAudio!.audioInfo!))
            .filter(info => info)
            .flatMap(info => info!.emotions.flatMap(e => {
              const emotions = e.emotion.split(/[,\s]+/).filter(em => em.trim() !== '');
              return emotions.filter(emotion => keyEmotions.includes(emotion.trim())).map(emotion => `${emotion.trim()}: "${e.sentence.substring(0, 40)}..."`);
            }))
            .slice(0, 2),
          improvementTips: ['增加語調的抑揚頓挫', '避免平淡無情緒的表達']
        },
        {
          criterion: '聲音活力度',
          score: (() => {
            // 基於積極情緒密度計算活力
            const energyEmotions = ['Helpful', 'Lighthearted', 'Encouraging', 'Positive'];
            const energyCount = energyEmotions.reduce((sum, emotion) => sum + (totalEmotions[emotion] || 0), 0);
            const densityScore = conversationLength > 0 ? (energyCount / conversationLength) * 100 : 30;
            const baseEnergy = 40;
            return Math.min(98, Math.max(25, baseEnergy + densityScore));
          })(),
          explanation: `基於積極情緒密度和表達活力度評估`,
          examples: timeline.flatMap(conv => conv.userSay ? [conv.userSay.substring(0, 50) + '...'] : []).slice(0, 2),
          improvementTips: ['保持聲音的活力與精神', '讓聲音更有感染力']
        },
        {
          criterion: '親和語氣力',
          score: (() => {
            // 基於友善情緒比例和禮貌用語
            const friendlyEmotions = ['Empathetic', 'Friendly', 'Understanding', 'Cooperative', 'Considerate'];
            const friendlyCount = friendlyEmotions.reduce((sum, emotion) => sum + (totalEmotions[emotion] || 0), 0);
            const friendlyRatio = keyEmotionCount > 0 ? friendlyCount / keyEmotionCount : 0;
            const affinityScore = 45 + friendlyRatio * 40;
            const courtesyBonus = timeline.reduce((count, conv) => {
              const courtesyWords = /[謝謝|感謝|請|麻煩|不好意思|對不起]/g;
              return count + (conv.userSay?.match(courtesyWords)?.length || 0);
            }, 0) * 3;
            return Math.min(98, Math.max(25, affinityScore + courtesyBonus));
          })(),
          explanation: `基於友善情緒比例和禮貌用語使用評估`,
          examples: timeline.flatMap(conv => conv.userSay ? [conv.userSay.substring(0, 50) + '...'] : []).slice(0, 2),
          improvementTips: ['使用溫暖友善的語氣', '讓對方感受到被尊重']
        },
        {
          criterion: '穩定應對力',
          score: (() => {
            // 基於情緒方差和問題處理能力
            const emotionSpread = keyEmotionCount > 0 ? 
              Math.sqrt(Object.values(totalEmotions).reduce((sum, count) => sum + Math.pow(count - (keyEmotionCount / Object.keys(totalEmotions).length), 2), 0) / Object.keys(totalEmotions).length) : 0;
            const stabilityScore = 80 - emotionSpread * 2;
            const problemHandling = Math.max(0, 20 - allProblems.length * 2);
            return Math.min(98, Math.max(25, stabilityScore + problemHandling));
          })(),
          explanation: `基於情緒分布穩定性和問題應對能力評估`,
          examples: allProblems.slice(0, 2),
          improvementTips: ['保持冷靜與一致性', '不因對方態度而情緒波動']
        },
        {
          criterion: '正向情緒傳達力',
          score: (() => {
            // 純粹基於正面情緒佔比
            const positiveRatio = totalEmotionCount > 0 ? positiveEmotionCount / totalEmotionCount : 0;
            const transmissionScore = 30 + positiveRatio * 55;
            const intensityBonus = Math.min(15, positiveEmotionCount * 1.5);
            return Math.min(98, Math.max(25, transmissionScore + intensityBonus));
          })(),
          explanation: `正面情緒佔比 ${totalEmotionCount > 0 ? ((positiveEmotionCount / totalEmotionCount) * 100).toFixed(1) : 0}%，正向傳達力評估`,
          examples: timeline
            .filter(conv => conv.userAudio?.audioInfo)
            .map(conv => parseAudioInfo(conv.userAudio!.audioInfo!))
            .filter(info => info)
            .flatMap(info => info!.emotions.filter(e => {
              const emotions = e.emotion.split(/[,\s]+/).filter(em => em.trim() !== '');
              return emotions.some(emotion => [
                'Empathetic', 'Appreciative', 'Helpful', 'Lighthearted', 'Friendly', 'Understanding', 
                'Acknowledging', 'Cooperative', 'Accommodating', 'Encouraging', 'Considerate', 'Responsible', 'Informative',
                'Reassuring', 'Positive'
              ].includes(emotion.trim()));
            }).map(e => e.sentence.substring(0, 40) + '...'))
            .slice(0, 2),
          improvementTips: ['透過聲音傳遞自信與熱情', '營造積極正向的氛圍']
        },
        {
          criterion: '聲音性格分析',
          score: (() => {
            // 基於主導情緒類型和一致性
            const dominantEmotion = Object.entries(totalEmotions)
              .filter(([emotion]) => emotion !== 'Others')
              .reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
            const consistencyScore = dominantEmotion[1] > 0 ? 
              50 + Math.min(30, (dominantEmotion[1] / totalEmotionCount) * 60) : 40;
            const diversityPenalty = Object.keys(totalEmotions).length > 8 ? 10 : 0;
            const personalityScore = consistencyScore - diversityPenalty;
            return Math.min(98, Math.max(25, personalityScore + (positiveEmotionCount - negativeEmotionCount)));
          })(),
          explanation: `基於主導情緒一致性和個性穩定度評估`,
          examples: timeline.flatMap(conv => conv.userSay ? [conv.userSay.substring(0, 50) + '...'] : []).slice(0, 2),
          improvementTips: ['建立一致的溝通風格', '展現可信任的聲音個性']
        }
      ],
      language: 'zh'
    };
  };

  // Check for history parameter in URL and retrieve analysis from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get the analysis result and chat history from localStorage
    const storedAnalysis = getStoredAnalysis();
    const storedChatMessages = getStoredChatMessages();

    const getMsgContent = (msg: any) => {
      if (typeof msg === 'string') return msg;
      if (msg && typeof msg === 'object') {
        return (msg.content ?? msg.title) || '';
      }
      return '';
    }

    const storedChatHistory = storedChatMessages ?
      JSON.parse(storedChatMessages)
        .filter((msg: any) => msg.role !== 'system')
        .map((msg: any) => `${msg.role}: ${getMsgContent(msg)}`)
        .join('\n\n') : '';

    if (storedAnalysis && storedChatHistory) {
      try {
        const parsedData = JSON.parse(storedAnalysis);

        // Check if it's audio timeline data
        if (parsedData.timeline && Array.isArray(parsedData.timeline)) {
          setAudioTimelineData(parsedData);
          setIsAudioTimeline(true);
          const analysisResult = analyzeAudioTimeline(parsedData);
          setLocalAnalysis(analysisResult);
        } else {
          // Original AnalysisResponse format
          if (Array.isArray(parsedData.scores)) {
            for (const scoreItem of parsedData.scores) {
              if (Array.isArray(scoreItem.examples)) {
                scoreItem.examples = scoreItem.examples.map((example: string) => example.trim());
              }
            }
          }
          setLocalAnalysis(parsedData);
          setIsAudioTimeline(false);
        }

        setLocalMessage(storedChatHistory);
        setLoading(false);

        // Trigger confetti if score is high
        const finalScore = isAudioTimeline ? analyzeAudioTimeline(parsedData).overallScore : parsedData.overallScore;
        if (finalScore >= 80) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 1000);
        }
      } catch (err) {
        console.error('Error parsing stored analysis:', err);
        setError('Error loading analysis results');
        setLoading(false);
      }
    } else {
      setError('No analysis results or chat history found');
      setLoading(false);
    }
  }, []);

  // Function to get overall score color
  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#FFE066]';
    if (score >= 60) return 'text-[#00A3E0]';
    if (score >= 40) return 'text-[#FFBD1F]';
    return 'text-red-400';
  };

  // Function to get emoji based on score
  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '👍';
    if (score >= 40) return '😐';
    return '😕';
  };

  // Function to get progress bar color based on score
  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-[#FFE066]';
    if (score >= 60) return 'bg-[#00A3E0]';
    if (score >= 40) return 'bg-[#FFBD1F]';
    return 'bg-red-400';
  };

  // Function to get localized UI text based on language
  const getLocalizedText = (key: string) => {
    const language = localAnalysis?.language || 'en';

    const localizedTexts: Record<string, Record<string, string>> = {
      en: {
        title: 'Conversation Analysis Report',
        backToDemo: 'Back',
        analyzing: 'Analyzing conversation...',
        error: 'Error',
        analysisResults: 'Analysis Results',
        conversationSummary: 'Conversation Summary',
        overallImprovementTips: 'Overall Improvement Tips',
        detailedScores: 'Detailed Scores',
        examples: 'Examples from the conversation:',
        improvementTips: 'Improvement Tips:',
        conversationHistory: 'Conversation History',
      },
      zh: {
        title: '對話分析報告',
        backToDemo: '返回',
        analyzing: '正在分析...',
        error: '錯誤',
        analysisResults: '分析結果',
        conversationSummary: '對話摘要',
        overallImprovementTips: '整體改進建議',
        detailedScores: '評分細節',
        examples: '對話中提到:',
        improvementTips: '改進建議:',
        conversationHistory: '對話紀錄',
      }
    };

    return localizedTexts[language]?.[key] || localizedTexts['en'][key];
  };

  // Render audio timeline section
  const renderAudioTimeline = () => {
    if (!audioTimelineData) return null;

    return (
      <div className="mt-8 space-y-6">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
          <FaVolumeUp className="mr-2 text-[#FFE066]" />
          對話時間軸分析
        </h3>
        {audioTimelineData.timeline.map((conversation, index) => (
          <div key={index} className="p-5 rounded-[20px] border border-[#2D5A67] bg-[#173944] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-lg text-white">{conversation.title}</h4>
            </div>
            
            {/* AI and User conversation */}
            <div className="space-y-3">
              <div className="bg-[#2D5A67] bg-opacity-50 p-3 rounded-[16px]">
                <div className="flex items-center mb-2">
                  <span className="text-[#FFE066] font-semibold mr-2">{conversation.aiRole}:</span>
                  {/* {conversation.aiAudio && (
                    <FaPlay className="text-[#FFE066] cursor-pointer hover:text-white transition-colors" 
                          onClick={() => window.open(conversation.aiAudio!.url, '_blank')} />
                  )} */}
                </div>
                <p className="text-white text-sm">{conversation.aiSay}</p>
              </div>
              
              <div className="bg-[#2D5A67] bg-opacity-50 p-3 rounded-[16px]">
                <div className="flex items-center mb-2">
                  <span className="text-[#00A3E0] font-semibold mr-2">{conversation.userRole}:</span>
                  {/* {conversation.userAudio && (
                    <FaPlay className="text-[#00A3E0] cursor-pointer hover:text-white transition-colors ml-2" 
                          onClick={() => window.open(conversation.userAudio!.url, '_blank')} />
                  )} */}
                </div>
                <p className="text-white text-sm mb-2">{conversation.userSay}</p>
                
                {/* Emotion analysis from audioInfo - show only relevant emotions for this time segment */}
                {conversation.userAudio?.audioInfo && (() => {
                  const audioInfo = parseAudioInfo(conversation.userAudio.audioInfo);
                  if (!audioInfo) return null;
                  
                  const currentEmotion = audioInfo.emotions[index];
                  const emotionTags = currentEmotion ? 
                    currentEmotion.emotion.split(/[,\s]+/).filter(e => e.trim() !== '') : 
                    ['穩定中立'];
                  
                  return (
                    <div className="mt-2 space-y-1">
                      <h5 className="text-xs font-semibold text-[#FFE066]">情緒分析:</h5>
                      <div className="flex flex-wrap gap-1">
                        {emotionTags.map((singleEmotion, idx) => (
                          <span key={idx} className={`text-xs px-2 py-1 rounded ${getEmotionColor(singleEmotion.trim())} bg-[#2D5A67]`}>
                            {singleEmotion.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Analysis and key points */}
            {conversation.analysis.length > 0 && (
              <div className="mt-3 bg-[#2D5A67] bg-opacity-30 p-3 rounded-[16px]">
                <h5 className="font-semibold text-white mb-2 flex items-center">
                  <FaLightbulb className="mr-2 text-[#FFE066]" />
                  改進建議
                </h5>
                <ul className="list-disc pl-5 space-y-1">
                  {conversation.analysis.slice(0, 3).map((tip, idx) => (
                    <li key={idx} className="text-white text-sm">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="analysis-page container mx-auto p-4 max-w-4xl bg-[#0F2D38] rounded-[20px] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
      {loading ? (
        <div className="text-white text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-red-400 text-center py-8">{error}</div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6 bg-[#194A54] p-4 rounded-[12px] shadow-[inset_0_0_6px_rgba(0,255,255,0.15)]">
            <h1 className="text-3xl font-bold text-white border-b pb-2 flex items-center">
              <FaChartBar className="mr-2 text-[#FFE066]" />
              {isAudioTimeline ? '音頻對話分析報告' : getLocalizedText('title')}
            </h1>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-[#00A3E0] text-white px-4 py-2 rounded-full hover:bg-[#00A3E0]/90 transition-colors duration-200 shadow-[0_2px_4px_rgba(0,160,255,0.3)] flex items-center"
              >
                <FaArrowLeft className="mr-2" />
                {getLocalizedText('backToDemo')}
              </button>
            )}
          </div>

          <div className="mt-8 space-y-6">

            {/* Summary Section */}
            <div className="p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <FaComments className="mr-2 text-[#FFE066]" />
                {getLocalizedText('conversationSummary')}
              </h2>
              <p className="text-white text-lg mb-6">{localAnalysis?.summary}</p>
              
              {/* Emotion Distribution Bar Chart */}
              {isAudioTimeline && audioTimelineData && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white mb-3">情緒分布圖</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          // Calculate emotions for chart - avoid duplicate audioInfo, separate key emotions from others
                          const chartEmotions: Record<string, number> = {};
                          const processedAudioInfo = new Set<string>();
                          
                          // Use same emotion definitions
                          const positiveEmotions = [
                            'Empathetic', 'Appreciative', 'Assertive', 'Helpful', 'Authoritative',
                            'Lighthearted', 'Friendly', 'Understanding', 'Acknowledging', 'Cooperative', 'Accommodating', 
                            'Encouraging', 'Considerate', 'Responsible', 'Informative', 'Reassuring', 'Positive'
                          ];
                          const negativeEmotions = ['Hesitant', 'Concerned', 'Frustrated', 'Aggressive','Anxious',"Desperate"];
                          const neutralEmotions = ['Suggestive', 'Explanatory', 'Practical', 'Neutral', 'Questioning'];
                          
                          // keyEmotions 為總和正負相的字詞
                          const keyEmotions = [...positiveEmotions, ...negativeEmotions, ...neutralEmotions];
                          
                          audioTimelineData.timeline.forEach(conversation => {
                            if (conversation.userAudio?.audioInfo && !processedAudioInfo.has(conversation.userAudio.audioInfo)) {
                              processedAudioInfo.add(conversation.userAudio.audioInfo);
                              const audioInfo = parseAudioInfo(conversation.userAudio.audioInfo);
                              if (audioInfo) {
                                audioInfo.emotions.forEach(emotion => {
                                  const emotions = emotion.emotion.split(/[,\s]+/).filter(e => e.trim() !== '');

                                  console.log(`emotions: ${emotions}`);  
                                  emotions.forEach(singleEmotion => {
                                    const trimmedEmotion = singleEmotion.trim();
                                    if (keyEmotions.includes(trimmedEmotion)) {
                                      chartEmotions[trimmedEmotion] = (chartEmotions[trimmedEmotion] || 0) + 1;
                                    } else {
                                      chartEmotions['Others'] = (chartEmotions['Others'] || 0) + 1;
                                    }
                                  });
                                });
                              }
                            }
                          });
                          
                          return Object.entries(chartEmotions).map(([emotion, count]) => ({
                            emotion,
                            count
                          }));
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D5A67" />
                        <XAxis 
                          dataKey="emotion" 
                          tick={{ fill: '#ffffff', fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tick={{ fill: '#ffffff', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#173944', 
                            border: '1px solid #2D5A67',
                            borderRadius: '8px',
                            color: '#ffffff'
                          }}
                          formatter={(value, name) => [value + ' 次', '出現次數']}
                          labelFormatter={(label) => `情緒: ${label}`}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#FFE066"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>


            {/* Radar Chart */}
            <div className="p-6 bg-[#173944] rounded-[20px] border border-[#2D5A67] shadow-[0_4px_20px_rgba(0,160,255,0.15)]">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <FaChartBar className="mr-2 text-[#FFE066]" />
                語音表達能力雷達圖
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={localAnalysis?.scores.map(score => ({
                    criterion: score.criterion,
                    score: score.score,
                    fullMark: 100
                  }))}>
                    <PolarGrid stroke="#2D5A67" />
                    <PolarAngleAxis 
                      dataKey="criterion" 
                      tick={{ 
                        fill: '#ffffff', 
                        fontSize: 12,
                        textAnchor: 'middle'
                      }}
                      className="text-white"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: '#ffffff', fontSize: 10 }}
                      tickCount={6}
                    />
                    <Radar
                      name="分數"
                      dataKey="score"
                      stroke="#FFE066"
                      fill="#FFE066"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>


            {/* Audio Timeline Section */}
            {isAudioTimeline && renderAudioTimeline()}

            
          </div>
        </>
      )}
    </div>
  );
} 