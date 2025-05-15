'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/agents"
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900">Agent Management</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create, edit, and manage your AI agents
          </p>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/tools"
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900">Tool Management</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create, edit, and manage your AI tools
          </p>
        </Link>
      </div>
    </div>
  );
} 