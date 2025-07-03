'use client';

import { useEffect, useState } from 'react';
import { UserBehaviorEvent } from '@/lib/elastic-service';

interface UserStats {
  totalConversations: number;
  firstConversationTime: string;
  lastConversationTime: string;
  uniqueUsers: {
    email: string;
    name: string;
    conversationCount: number;
    firstConversationTime: string;
    lastConversationTime: string;
    lastActivityTime: string;
    timeElapsedSinceLastActivity: string;
  }[];
}


interface ElasticSearchResponse {
  hits: {
    hits: Array<{
      _source: UserBehaviorEvent;
    }>;
  };
}

export default function AgentReport({ params }: any) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const agentId = params.Agentid;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // First get all conversation_start events
        const response = await fetch(`/api/elastic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            size: 10000,
            query: {
              bool: {
                must: [
                  { term: { 'event_name': 'conversation_start' } },
                  { term: { 'action.action_properties.agentId.keyword': agentId } }
                ]
              }
            },
            sort: {
              '@timestamp': 'desc'
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to fetch data');
        }

        const result = await response.json() as ElasticSearchResponse;

        // Process the results
        const users = new Map<string, {
          email: string;
          name: string;
          conversations: Set<string>;
          firstTime: string;
          lastTime: string;
          lastActivityTime: string;
        }>();

        result.hits.hits.forEach((hit) => {
          const event = hit._source;
          const email = event.action.action_properties.email?.toLowerCase().trim();
          const name = event.action.action_properties.uname;
          const convId = event.action.action_properties.convId;
          const timestamp = event['@timestamp'];

          if (email && name) {
            if (!users.has(email)) {
              users.set(email, {
                email,
                name,
                conversations: new Set([timestamp]),
                firstTime: timestamp,
                lastTime: timestamp,
                lastActivityTime: timestamp
              });
            } else {
              const user = users.get(email)!;
              user.conversations.add(timestamp);
              if (timestamp < user.firstTime) user.firstTime = timestamp;
              if (timestamp > user.lastTime) user.lastTime = timestamp;
            }
          }
        });

        // Now get the last activity for each user
        for (const user of users.values()) {
          const lastActivityResponse = await fetch(`/api/elastic`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              size: 1,
              query: {
                bool: {
                  must: [
                    { term: { 'action.action_properties.agentId.keyword': agentId } },
                    { term: { 'action.action_properties.email.keyword': user.email } }
                  ]
                }
              },
              sort: {
                '@timestamp': 'desc'
              }
            })
          });

          if (lastActivityResponse.ok) {
            const lastActivityResult = await lastActivityResponse.json();
            if (lastActivityResult.hits.hits.length > 0) {
              user.lastActivityTime = lastActivityResult.hits.hits[0]._source['@timestamp'];
            }
          }
        }

        // Calculate time elapsed
        const calculateTimeElapsed = (lastActivityTime: string, lastConversationTime: string): string => {
          const activityTime = new Date(lastActivityTime);
          const conversationTime = new Date(lastConversationTime);
          const diffMs = activityTime.getTime() - conversationTime.getTime();
          
          if (diffMs < 0) return '0 分鐘';
          
          const minutes = Math.floor(diffMs / (1000 * 60));
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);
          
          if (days > 0) return `${days} 天`;
          if (hours > 0) return `${hours} 小時`;
          if (minutes > 0) return `${minutes} 分鐘`;
          return '小於1分鐘';
        };

        // Convert to stats
        const stats: UserStats = {
          totalConversations: result.hits.hits.length,
          firstConversationTime: Array.from(users.values()).reduce((earliest, user) => 
            user.firstTime < earliest ? user.firstTime : earliest, 
            new Date().toISOString()
          ),
          lastConversationTime: Array.from(users.values()).reduce((latest, user) => 
            user.lastTime > latest ? user.lastTime : latest, 
            ''
          ),
          uniqueUsers: Array.from(users.values()).map(user => ({
            email: user.email,
            name: user.name,
            conversationCount: user.conversations.size,
            firstConversationTime: user.firstTime,
            lastConversationTime: user.lastTime,
            lastActivityTime: user.lastActivityTime,
            timeElapsedSinceLastActivity: calculateTimeElapsed(user.lastActivityTime, user.lastTime)
          }))
        };

        setStats(stats);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [agentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="text-center">No data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <span className="text-yellow-400">📊</span>
          agent使用紀錄
        </h1>

        {/* Overview Stats */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-yellow-400">💬</span>
            對話摘要
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 mb-2">總對話次數</div>
              <div className="text-3xl font-bold">{stats.totalConversations}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 mb-2">首次對話時間</div>
              <div className="text-lg">
                {new Date(stats.firstConversationTime).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 mb-2">最後對話時間</div>
              <div className="text-lg">
                {new Date(stats.lastConversationTime).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-yellow-400">👥</span>
            使用者統計
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="py-2 px-4">使用者</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">對話次數</th>
                  <th className="py-2 px-4">首次使用時間</th>
                  <th className="py-2 px-4">最近一次使用時間</th>
                  <th className="py-2 px-4">最近一次結束時間</th>
                  <th className="py-2 px-4 text-sm">使用時間</th>
                </tr>
              </thead>
              <tbody>
                {stats.uniqueUsers.map((user, index) => (
                  <tr key={user.email} className="border-b border-gray-700">
                    <td className="py-2 px-4">{user.name}</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4">{user.conversationCount}</td>
                    <td className="py-2 px-4">{new Date(user.firstConversationTime).toLocaleString()}</td>
                    <td className="py-2 px-4">{new Date(user.lastConversationTime).toLocaleString()}</td>
                    <td className="py-2 px-4">{new Date(user.lastActivityTime).toLocaleString()}</td>
                    <td className="py-2 px-4">{user.timeElapsedSinceLastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
