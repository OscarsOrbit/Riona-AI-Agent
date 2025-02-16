import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, ChartBarIcon, DocumentTextIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { agentApi } from './api/agent';
import { AgentRules, AgentStats, AgentStatus, WebSocketUpdate } from '../../shared/types';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');


const defaultRules: AgentRules = {
  allowedHashtags: ['realestate', 'business', 'entrepreneur'],
  blockedHashtags: ['nsfw', 'politics'],
  allowedKeywords: ['success', 'growth', 'business'],
  blockedKeywords: ['spam', 'scam'],
  maxPostsPerSession: 20,
  interactionDelay: {
    min: 5000,
    max: 15000
  },
  commentStyle: 'professional',
  commentTopics: ['business growth', 'professional development'],
  avoidTopics: ['politics', 'religion']
};


function App() {
  const [activeTab, setActiveTab] = useState('config');
  const [rules, setRules] = useState<AgentRules>(defaultRules);
  const [agentStatus, setAgentStatus] = useState('stopped');
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<AgentStats>({
    postsScanned: 0,
    postsInteracted: 0,
    likesGiven: 0,
    commentsPosted: 0,
    lastInteraction: '-'
  });

  const handleArrayInput = (key: keyof AgentRules, value: string) => {
    const array = value.split(',').map(item => item.trim());
    setRules(prev => ({
      ...prev,
      [key]: array
    }));
  };

  const handleNumberInput = (key: keyof AgentRules, value: string) => {
    const num = parseInt(value);
    if (!isNaN(num)) {
      setRules(prev => ({
        ...prev,
        [key]: num
      }));
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const startAgent = async () => {
    try {
      await agentApi.startAgent(rules);
      setAgentStatus('running');
      addLog('Agent started with current configuration');
    } catch (error) {
      addLog(`Error starting agent: ${error}`);
    }
  };

  const stopAgent = async () => {
    try {
      await agentApi.stopAgent();
      setAgentStatus('stopped');
      addLog('Agent stopped');
    } catch (error) {
      addLog(`Error stopping agent: ${error}`);
    }
  };

  useEffect(() => {
    // Initial status check
    agentApi.getAgentStatus().then(status => {
      setAgentStatus(status.status);
      if (status.currentRules) {
        setRules(status.currentRules);
      }
      setStats(status.stats);
    }).catch(error => {
      console.error('Error getting initial status:', error);
    });

    // WebSocket event listeners
    socket.on('connect', () => {
      addLog('Connected to agent server');
    });

    socket.on('disconnect', () => {
      addLog('Disconnected from agent server');
    });

    socket.on('update', (update: WebSocketUpdate) => {
      switch (update.type) {
        case 'status':
          setAgentStatus(update.data.status);
          break;
        case 'stats':
          setStats(update.data);
          break;
        case 'log':
          addLog(update.data);
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Save rules to backend when they change
  useEffect(() => {
    const saveRules = async () => {
      try {
        await agentApi.updateRules(rules);
        addLog('Rules updated successfully');
      } catch (error) {
        addLog(`Error updating rules: ${error}`);
      }
    };

    const debounceTimer = setTimeout(saveRules, 1000);
    return () => clearTimeout(debounceTimer);
  }, [rules]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Riona Social Agent Control Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                agentStatus === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
              </span>
              <button
                onClick={agentStatus === 'stopped' ? startAgent : stopAgent}
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  agentStatus === 'stopped'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {agentStatus === 'stopped' ? (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Start Agent
                  </>
                ) : (
                  <>
                    <StopIcon className="h-4 w-4 mr-2" />
                    Stop Agent
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'config' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'monitoring' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Monitoring
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'logs' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Logs
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Content Filtering */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Content Filtering</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Allowed Hashtags
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={rules.allowedHashtags.join(', ')}
                      onChange={(e) => handleArrayInput('allowedHashtags', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Blocked Hashtags
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={rules.blockedHashtags.join(', ')}
                      onChange={(e) => handleArrayInput('blockedHashtags', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Allowed Keywords
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={rules.allowedKeywords.join(', ')}
                      onChange={(e) => handleArrayInput('allowedKeywords', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Blocked Keywords
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={rules.blockedKeywords.join(', ')}
                      onChange={(e) => handleArrayInput('blockedKeywords', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Interaction Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Interaction Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Posts Per Session
                    </label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={rules.maxPostsPerSession}
                      onChange={(e) => handleNumberInput('maxPostsPerSession', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Comment Style
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={rules.commentStyle}
                      onChange={(e) => setRules(prev => ({ ...prev, commentStyle: e.target.value }))}
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Topics */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Topics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Comment Topics
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={rules.commentTopics.join(', ')}
                      onChange={(e) => handleArrayInput('commentTopics', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Topics to Avoid
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={rules.avoidTopics.join(', ')}
                      onChange={(e) => handleArrayInput('avoidTopics', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="text-sm font-medium text-gray-500">Posts Scanned</h4>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.postsScanned}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="text-sm font-medium text-gray-500">Posts Interacted</h4>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.postsInteracted}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="text-sm font-medium text-gray-500">Likes Given</h4>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.likesGiven}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="text-sm font-medium text-gray-500">Comments Posted</h4>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.commentsPosted}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Last Interaction</h4>
                <p className="mt-1 text-lg text-gray-900">{stats.lastInteraction}</p>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setLogs([])}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Logs
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="py-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
