import { AgentRules, AgentStatus } from '../../../shared/types';

const API_BASE_URL = 'http://localhost:3001/api';

export const agentApi = {
  startAgent: async (rules: AgentRules) => {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rules),
      });
      return response.json();
    } catch (error) {
      console.error('Error starting agent:', error);
      throw error;
    }
  },

  stopAgent: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/stop`, {
        method: 'POST',
      });
      return response.json();
    } catch (error) {
      console.error('Error stopping agent:', error);
      throw error;
    }
  },

  getAgentStatus: async (): Promise<AgentStatus> => {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/status`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting agent status:', error);
      throw error;
    }
  },

  updateRules: async (rules: AgentRules) => {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rules),
      });
      return response.json();
    } catch (error) {
      console.error('Error updating rules:', error);
      throw error;
    }
  },
};
