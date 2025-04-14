import React from 'react';

export default function IntroPage() {
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

        <div className="mt-16 text-center">
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