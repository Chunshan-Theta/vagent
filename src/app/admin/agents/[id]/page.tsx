'use client';

import { useState, useEffect, use } from 'react';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Agent } from '@/app/types/agent';

export default function ViewAgentPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgent();
  }, [params.id]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      const data = await response.json();
      if (!data.success || !data.agent) {
        throw new Error('Invalid response format');
      }
      setAgent(data.agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent');
    }
  };

  if (!agent) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Agent Details</h1>
        <div className="space-x-3">
          <Link
            href={`/admin/agents/${params.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </Link>
          <Link
            href="/admin/agents"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <div className="mt-1 text-sm text-gray-900">{agent.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Agent  Description</label>
              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{agent.public_description}</div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-900">Prompt Configuration</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Agent  Name</label>
              <div className="mt-1 text-sm text-gray-900">{agent.prompt_name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Agent  Describe</label>
              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{agent.prompt_personas}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Agent  Customers Describe</label>
              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{agent.prompt_customers}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Agent  Tool Plugin Describe</label>
              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{agent.prompt_tool_logics}</div>
            </div>
            {agent.prompt_voice_styles && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Agent  Voice Styles</label>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{agent.prompt_voice_styles}</div>
              </div>
            )}
            {agent.prompt_conversation_modes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Agent  Conversation Modes</label>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{agent.prompt_conversation_modes}</div>
              </div>
            )}
            {agent.prompt_prohibited_phrases && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Agent Prohibited Rules</label>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{agent.prompt_prohibited_phrases}</div>
              </div>
            )}
            {agent.criteria && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Agent Criteria</label>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{agent.criteria}</div>
              </div>
            )}
          </div>
        </div>

        {agent.tools && agent.tools.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900">Tools</h2>
            <div className="mt-4 space-y-4">
              {agent.tools.map((tool) => (
                <div key={tool.id} className="border rounded p-4">
                  <div className="font-medium">{tool.name}</div>
                  {tool.description && (
                    <div className="mt-1 text-sm text-gray-500">{tool.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 