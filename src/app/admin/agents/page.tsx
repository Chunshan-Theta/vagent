'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      if (!data.success || !Array.isArray(data.agents)) {
        throw new Error('Invalid response format: expected {success: true, agents: []}');
      }
      setAgents(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      const response = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete agent');
      await fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
        <Link 
          href="/admin/agents/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add New Agent
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{agent.public_description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Link
                    href={`/admin/agents/${agent.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/agents/${agent.id}/edit`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 