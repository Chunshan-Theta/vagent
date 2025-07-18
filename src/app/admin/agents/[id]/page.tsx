'use client';

import { useState, useEffect } from 'react';
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
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Agent Details</h1>
        <div className="space-x-3">
          <Link
            href={`/admin/agents/${params.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </Link>
          <Link
            href={`/admin/agents/${params.id}/test`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Testing
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

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">ID</label>
              <div className="mt-1 text-base text-gray-900 break-all">{agent.id}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <div className="mt-1 text-base text-gray-900">{agent.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Voice</label>
              <div className="mt-1 text-base text-gray-900">{agent.voice}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Created At</label>
              <div className="mt-1 text-base text-gray-900">{new Date(agent.created_at).toLocaleString()}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Updated At</label>
              <div className="mt-1 text-base text-gray-900">{new Date(agent.updated_at).toLocaleString()}</div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-500">Agent Description</label>
              <div className="mt-1 text-base text-gray-900 whitespace-pre-wrap">{agent.public_description}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Prompt Configuration</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">Agent Name</label>
              <div className="mt-1 text-base text-gray-900 bg-gray-50 p-3 rounded-md">{agent.prompt_name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Agent Description</label>
              <div className="mt-1 text-base text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{agent.prompt_personas}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Agent Customers Description</label>
              <div className="mt-1 text-base text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{agent.prompt_customers}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Agent Tool Plugin Description</label>
              <div className="mt-1 text-base text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{agent.prompt_tool_logics}</div>
            </div>
            {agent.prompt_voice_styles && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Agent Voice Styles</label>
                <div className="mt-1 text-base text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{agent.prompt_voice_styles}</div>
              </div>
            )}
            {agent.prompt_conversation_modes && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Agent Conversation Modes</label>
                <div className="mt-1 text-base text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{agent.prompt_conversation_modes}</div>
              </div>
            )}
            {agent.prompt_prohibited_phrases && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Agent Prohibited Rules</label>
                <div className="mt-1 text-base text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{agent.prompt_prohibited_phrases}</div>
              </div>
            )}
            {agent.criteria && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Agent Criteria</label>
                <div className="mt-1 text-base text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{agent.criteria}</div>
              </div>
            )}
          </div>
        </div>

        {agent.tools && agent.tools.length > 0 && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tools</h2>
            <div className="grid gap-4">
              {agent.tools.map((tool) => (
                <div key={tool.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="font-medium text-gray-900">{tool.name}</div>
                  {tool.description && (
                    <div className="mt-2 text-sm text-gray-600">{tool.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Raw JSON Data</h2>
          <div className="overflow-hidden">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(agent, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 