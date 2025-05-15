'use client';

import { useState, useEffect } from 'react';
import { Tool } from '@/db';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

interface ToolFormProps {
  tool?: Tool;
  mode: 'create' | 'edit';
}

export default function ToolForm({ tool, mode }: ToolFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: tool?.name || '',
    tool_type: tool?.tool_type || '',
    api_url: tool?.api_url || '',
    api_key: tool?.api_key || '',
    agent_id: tool?.agent_id || '',
    session_id: tool?.session_id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = mode === 'create' ? '/api/tools' : `/api/tools/${tool?.tool_id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      router.push('/admin/tools');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        {mode === 'create' ? 'Create New Tool' : 'Edit Tool'}
      </h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="tool_type">Tool Type</Label>
          <Select
            value={formData.tool_type}
            onValueChange={(value) => setFormData({ ...formData, tool_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tool type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ragflow">RAGFLOW</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="api_url">API URL</Label>
          <Input
            id="api_url"
            value={formData.api_url}
            onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="api_key">API Key</Label>
          <Input
            id="api_key"
            type="password"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="agent_id">Agent ID</Label>
          <Input
            id="agent_id"
            value={formData.agent_id}
            onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="session_id">Session ID</Label>
          <Input
            id="session_id"
            value={formData.session_id}
            onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit">
          {mode === 'create' ? 'Create Tool' : 'Update Tool'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/tools')}>
          Cancel
        </Button>
      </div>
    </form>
  );
} 