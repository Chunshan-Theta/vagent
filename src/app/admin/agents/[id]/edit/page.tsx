'use client';

import { useState, useEffect, use } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Agent, Tool } from '@/app/types/agent';

export default function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Agent>>({});
  const [error, setError] = useState<string | null>(null);
  const [availableTools, setAvailableTools] = useState<Array<any>>([]);

  useEffect(() => {
    fetchAgent();
    fetchTools();
  }, [id]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${id}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      const data = await response.json();
      if (!data.success || !data.agent) {
        throw new Error('Invalid response format');
      }
      setFormData(data.agent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent');
    }
  };

  const fetchTools = async () => {
    try {
      const response = await fetch('/api/tools');
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      if (!data.success || !Array.isArray(data.tools)) {
        throw new Error('Invalid response format: expected {success: true, tools: []}');
      }
      setAvailableTools(data.tools);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tools');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...formData,
      tools: formData.tools?.map((tool: Tool) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        tool_id: tool.tool_id
      }))
    };

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to update agent');
      
      router.push(`/admin/agents/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>

      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Agent  Description</label>
          <textarea
            value={formData.public_description || ''}
            onChange={(e) => setFormData({ ...formData, public_description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Agent  Name</label>
          <input
            type="text"
            value={formData.prompt_name || ''}
            onChange={(e) => setFormData({ ...formData, prompt_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Agent  Describe</label>
          <textarea
            value={formData.prompt_personas || ''}
            onChange={(e) => setFormData({ ...formData, prompt_personas: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Agent  Customers Describe</label>
          <textarea
            value={formData.prompt_customers || ''}
            onChange={(e) => setFormData({ ...formData, prompt_customers: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Agent  Tool Plugin Describe</label>
          <textarea
            value={formData.prompt_tool_logics || ''}
            onChange={(e) => setFormData({ ...formData, prompt_tool_logics: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Agent  Voice Styles</label>
          <textarea
            value={formData.prompt_voice_styles || ''}
            onChange={(e) => setFormData({ ...formData, prompt_voice_styles: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Voice</label>
          <select
            value={formData.voice || 'echo'}
            onChange={e => setFormData({ ...formData, voice: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="alloy">alloy</option>
            <option value="ash">ash</option>
            <option value="ballad">ballad</option>
            <option value="coral">coral</option>
            <option value="echo">echo</option>
            <option value="sage">sage</option>
            <option value="shimmer">shimmer</option>
            <option value="verse">verse</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Agent  Conversation Modes</label>
          <textarea
            value={formData.prompt_conversation_modes || ''}
            onChange={(e) => setFormData({ ...formData, prompt_conversation_modes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Agent Prohibited Rules</label>
          <textarea
            value={formData.prompt_prohibited_phrases || ''}
            onChange={(e) => setFormData({ ...formData, prompt_prohibited_phrases: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Agent Criteria</label>
          <textarea
            value={formData.criteria || ''}
            onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tools</label>
          <div className="space-y-2">
            {availableTools.map((toolConfig: any) => {
              const isSelected = formData.tools?.some(t => t.id === toolConfig.id);
              const selectedTool = formData.tools?.find(t => t.id === toolConfig.id);
              
              return (
                <div key={toolConfig.id} className="flex items-center space-x-4 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newTools: Tool[] = e.target.checked
                        ? [...(formData.tools || []), { id: toolConfig.id, name: toolConfig.name, description: '', tool_id: toolConfig.tool_id }]
                        : (formData.tools || []).filter(t => t.id !== toolConfig.id);
                      setFormData({ ...formData, tools: newTools });
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{toolConfig.name}</div>
                    <div className="text-sm text-gray-500">{toolConfig.tool_type}</div>
                    {isSelected && (
                      <input
                        type="text"
                        value={selectedTool?.description || ''}
                        onChange={(e) => {
                          const newTools = (formData.tools || []).map(t =>
                              t.id === toolConfig.id ? { ...t, description: e.target.value } : t
                          );
                          setFormData({ ...formData, tools: newTools });
                        }}
                        placeholder="Enter tool description"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/admin/agents/${id}`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
} 