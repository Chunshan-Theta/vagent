'use client';

import React, { useState } from 'react';

export default function IntroPage() {
  const [apiKey, setApiKey] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('API key saved successfully!');
        setApiKey('');
      } else {
        setError(data.error || 'Failed to save API key');
      }
    } catch (err) {
      setError('An error occurred while saving the API key');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to VAgent
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Your intelligent virtual agent platform for seamless automation and assistance.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-900">Quick Start</h3>
              <p className="mt-2 text-gray-500">
                Get started in minutes with our intuitive setup process.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl mb-4">⚡</div>
              <h3 className="text-lg font-medium text-gray-900">Powerful Automation</h3>
              <p className="mt-2 text-gray-500">
                Automate complex tasks with our advanced agent system.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-2xl mb-4">🔒</div>
              <h3 className="text-lg font-medium text-gray-900">Secure & Reliable</h3>
              <p className="mt-2 text-gray-500">
                Built with security and reliability in mind.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Set Your OpenAI API Key</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  name="apiKey"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter your OpenAI API key"
                  required
                />
              </div>
              {message && (
                <div className="text-green-600 text-sm">{message}</div>
              )}
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <button
                type="submit"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save API Key
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/demo"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
} 