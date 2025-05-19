'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Agent, Tool } from '@/app/types/agent';

export default function NewAgentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Agent>>({});
  const [error, setError] = useState<string | null>(null);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchTools();
  }, []);

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
      tools: formData.tools?.map((tool: any) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        tool_id: tool.tool_id
      }))
    };

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save agent');
      
      router.push('/admin/agents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent');
    }
  };

  const generateCriteria = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          public_description: formData.public_description,
          prompt_name: formData.prompt_name,
          prompt_personas: formData.prompt_personas,
          prompt_customers: formData.prompt_customers,
          prompt_tool_logics: formData.prompt_tool_logics,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate criteria');
      const data = await response.json();
      setFormData({ ...formData, criteria: data.criteria });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate criteria');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Create New Agent</h1>
      </div>
      
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
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Agent Criteria</label>
            <button
              type="button"
              onClick={generateCriteria}
              disabled={isGenerating}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 flex items-center gap-1"
            >
              {isGenerating ? 'Generating...' : 'Auto Generate'}
            </button>
          </div>
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
            {availableTools.map((tool) => {
              const isSelected = formData.tools?.some(t => t.id === tool.id);
              const selectedTool = formData.tools?.find(t => t.id === tool.id);
              
              return (
                <div key={tool.id} className="flex items-center space-x-4 p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newTools = e.target.checked
                        ? [...(formData.tools || []), { 
                            id: tool.id, 
                            name: tool.name, 
                            description: '', 
                            tool_id: tool.tool_id,
                          }]
                        : (formData.tools || []).filter(t => t.id !== tool.id);
                      setFormData({ ...formData, tools: newTools });
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{tool.name}</div>
                    {isSelected && (
                      <input
                        type="text"
                        value={selectedTool?.description || ''}
                        onChange={(e) => {
                          const newTools = (formData.tools || []).map(t =>
                            t.id === tool.id ? { ...t, description: e.target.value } : t
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
            onClick={() => router.push('/admin/agents')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
} 