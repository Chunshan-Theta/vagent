'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const agentSchema = z.object({
  name: z.string(),
  public_description: z.string(),
  prompt_name: z.string(),
  prompt_personas: z.string(),
  prompt_customers: z.string(),
  prompt_tool_logics: z.string(),
  prompt_voice_styles: z.string().optional(),
  prompt_conversation_modes: z.string().optional(),
  prompt_prohibited_phrases: z.string().optional(),
  tools: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string()
  })).optional(),
});

type Agent = z.infer<typeof agentSchema> & { id: number };

export default function EditAgentPage({ params }: { params: any }) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Agent>>({});
  const [error, setError] = useState<string | null>(null);
  const [availableTools, setAvailableTools] = useState<Array<{ id: string; name: string; tool_type: string }>>([]);

  useEffect(() => {
    fetchAgent();
    fetchTools();
  }, [params.id]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${params.id}`);
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
    try {
      const response = await fetch(`/api/agents/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update agent');
      
      router.push(`/admin/agents/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>
        <Link
          href={`/admin/agents/${params.id}`}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
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
          <label className="block text-sm font-medium text-gray-700">Public Description</label>
          <textarea
            value={formData.public_description || ''}
            onChange={(e) => setFormData({ ...formData, public_description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prompt Name</label>
          <input
            type="text"
            value={formData.prompt_name || ''}
            onChange={(e) => setFormData({ ...formData, prompt_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prompt Personas</label>
          <textarea
            value={formData.prompt_personas || ''}
            onChange={(e) => setFormData({ ...formData, prompt_personas: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prompt Customers</label>
          <textarea
            value={formData.prompt_customers || ''}
            onChange={(e) => setFormData({ ...formData, prompt_customers: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prompt Tool Logics</label>
          <textarea
            value={formData.prompt_tool_logics || ''}
            onChange={(e) => setFormData({ ...formData, prompt_tool_logics: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prompt Voice Styles</label>
          <textarea
            value={formData.prompt_voice_styles || ''}
            onChange={(e) => setFormData({ ...formData, prompt_voice_styles: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prompt Conversation Modes</label>
          <textarea
            value={formData.prompt_conversation_modes || ''}
            onChange={(e) => setFormData({ ...formData, prompt_conversation_modes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Prompt Prohibited Phrases</label>
          <textarea
            value={formData.prompt_prohibited_phrases || ''}
            onChange={(e) => setFormData({ ...formData, prompt_prohibited_phrases: e.target.value })}
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
                        ? [...(formData.tools || []), { id: tool.id, name: tool.name, description: '' }]
                        : (formData.tools || []).filter(t => t.id !== tool.id);
                      setFormData({ ...formData, tools: newTools });
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-sm text-gray-500">{tool.tool_type}</div>
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
            onClick={() => router.push(`/admin/agents/${params.id}`)}
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