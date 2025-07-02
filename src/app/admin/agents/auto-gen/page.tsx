'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface AgentConfig {
  AgentName: string;
  AgentDescription: string;
  AgentCustomersDescribe: string;
  AgentToolPluginDescribe: string;
  AgentVoiceStyles: string;
  Echo: string;
  AgentConversationModes: string;
  AgentProhibitedRules: string;
  AgentCriteria: string;
}

export default function AutoGenAgent() {
  const [file, setFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState('assistants');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentConfig | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);

      const response = await fetch('/api/agents/auto-gen', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      // Parse the JSON string from the text property
      const agentConfig: AgentConfig = JSON.parse(data.text.replace(/```json\n|\n```/g, ''));
      setResult(agentConfig);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label: string, content: string) => (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{label}</h3>
      <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{content}</p>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Auto Generate Agent</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        <div>
          <Label htmlFor="file">Upload File</Label>
          <Input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="purpose">Purpose</Label>
          <Input
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="mt-1"
          />
        </div>

        <Button type="submit" disabled={!file || loading}>
          {loading ? 'Processing...' : 'Generate Agent'}
        </Button>
      </form>

      {result && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6">{result.AgentName}</h2>
          
          {renderField('描述', result.AgentDescription)}
          {renderField('目標客群', result.AgentCustomersDescribe)}
          {renderField('工具與插件', result.AgentToolPluginDescribe)}
          {renderField('語音風格', result.AgentVoiceStyles)}
          {renderField('性別', result.Echo)}
          {renderField('對話模式', result.AgentConversationModes)}
          {renderField('禁止規則', result.AgentProhibitedRules)}
          {renderField('評估標準', result.AgentCriteria)}
        </div>
      )}
    </div>
  );
} 