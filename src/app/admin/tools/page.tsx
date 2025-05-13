'use client';

import { useState, useEffect } from 'react';
import { Tool } from '@/db';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    const response = await fetch('/api/tools');
    const data = await response.json();
    if (data.success) {
      setTools(data.tools);
    }
  };

  const deleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    
    const response = await fetch(`/api/tools/${toolId}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      await fetchTools();
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-end mb-6">
        <Button onClick={() => router.push('/admin/tools/new')} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          New Tool
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>API URL</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((tool) => (
            <TableRow key={tool.tool_id}>
              <TableCell>{tool.name}</TableCell>
              <TableCell className="font-mono text-sm">{tool.tool_id}</TableCell>
              <TableCell>{tool.tool_type}</TableCell>
              <TableCell>{tool.api_url}</TableCell>
              <TableCell>{new Date(tool.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/tools/edit/${tool.tool_id}`)}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTool(tool.tool_id)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 