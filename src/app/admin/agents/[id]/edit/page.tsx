'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Agent, Tool } from '@/app/types/agent';
import _ from '@/app/vendor/lodash';
import { agentApi } from '@/app/lib/ai-chat'

export default function EditAgentPage() {
  const { id } = useParams<{ id: string }>();
  const agentSetttings = useAgentSettings(id);
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
                    checked={!!isSelected}
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
      {/* 這邊提供 agent settings 相關的設置 */}
      <h1 className="text-2xl font-bold text-gray-900 mt-8">Edit Details</h1>
      <form id="details" className="bg-white shadow-sm rounded-lg p-6 space-y-4">
        {agentSetttings.getUI()}
      </form>
    </div>
  );
}


function useAgentSettings(agentId: string) {
  type EditField = {
    type: 'text' | 'textarea' | 'json'
    key: string
    title: string
    description?: string
    placeholder?: string
  }
  const [updated, setUpdated] = useState(0);
  const doUpdate = () => {
    setUpdated(prev => prev + 1);
  }
  /**
   * 這邊列出所有的 agent settings 欄位
   * 這些欄位會在 Edit Details 下顯示
   */
  const fields: { [key: string]: EditField } = {
    abc: {
      type: 'text',
      key: 'abc',
      title: 'ABC Setting',
      description: 'This is a sample setting for ABC'
    }
  }
  const values = useRef<{ [key: string]: any }>({});
  const fieldStates = useRef<{ [key: string]: { loading?: boolean, error?: string } }>({})

  const updateState = (key: string, patch: Partial<typeof fieldStates.current[string]>) => {
    if (!fieldStates.current[key]) {
      fieldStates.current[key] = {};
    }
    fieldStates.current[key] = {
      ...fieldStates.current[key],
      ...patch
    };
  }
  const getState = (key: string) => {
    return fieldStates.current[key] || {};
  }

  const loading = useMemo(() => {
    return Object.values(fieldStates).some(state => state.loading);
  }, [fieldStates]);

  // INIT

  useEffect(() => {
    refreshFields();
  }, [agentId]);


  async function refreshFields(keys?: string[]) {
    if (!keys) {
      keys = Object.keys(fields);
    }
    const res = await agentApi.getAgentSettings(agentId, keys);
    const nValues = res.values || {};
    console.log('refresh fields:', nValues);
    for(const key in nValues) {
      setField(key, nValues[key])
    }
  }

  // 這邊用來儲存各個欄位的更新函式，會套用 throttle
  const updateFieldsFuncMap = useRef<{ [key: string]: () => void }>({});


  const setField = (key: string, value: any) => {
    values.current[key] = value;
    doUpdate();
  };


  const getField = (key: string) => {
    return values.current[key] || '';
  };

  const updateFields = async (keys: string[]) => {
    const keyVal = keys.reduce((map, key) => {
      map[key] = getField(key);
      return map;
    }, {} as Record<string, string>);
    await agentApi.setAgentSettings(agentId, keyVal)
  }

  /** 針對各個 key 套用 debounce */
  const btnUpdateField = (key: string) => {
    // return;

    if (updateFieldsFuncMap.current[key]) {
      updateFieldsFuncMap.current[key]();
      return;
    }
    const update = () => {
      // updateState(key, { loading: true });
      updateFields([key])
        .then(() => {
          // success, do nothing.
        })
        .catch((err) => {
          // updateState(key, { error: err.message });
          console.error(`Error updating field ${key}`, err);
        })
        .finally(() => {
          // updateState(key, { loading: false });
        })
    }
    const updateFunc = _.throttle(update, 1000, { leading: false, trailing: true });

    updateFieldsFuncMap.current[key] = updateFunc;
    updateFunc();
    return;
  }

  const getUI = () => {
    return (
      <>
        {/* 根據 fields 生成對應的編輯框 */}
        {Object.entries(fields).map(([key, field]) => {
          const value = getField(key);
          return (
            <div key={key} className="mb-2">
              <label className="block text-sm font-medium text-gray-700">{field.title}</label>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => { setField(key, e.target.value); btnUpdateField(key); }}
                  className="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border border-gray-200"
                  placeholder={field.placeholder ?? ''}
                />
              )}
              {field.type === 'textarea' && (
                <textarea
                  value={value}
                  onChange={(e) => { setField(key, e.target.value); btnUpdateField(key); }}
                  className="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border border-gray-200"
                  rows={3}
                  placeholder={field.placeholder ?? ''}
                />
              )}
              {field.type === 'json' && (
                <textarea
                  value={value}
                  onChange={(e) => { setField(key, e.target.value); btnUpdateField(key); }}
                  className="mt-1 p-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border border-gray-200"
                  rows={5}
                  placeholder={field.placeholder ?? ''}
                />
              )}
              {field.description && (
                <p className="text-sm text-gray-500 mt-0">{field.description}</p>
              )}
            </div>
          );
        })}
      </>
    )
  }
  return {
    values,
    fields,
    setField,
    getField,
    updateFields,
    getUI
  }
}