import { AskResponse, QueryMemoryEntry } from './types';

const API_BASE_URL = 'http://localhost:3000';

export async function askQuestion(question: string): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to get response');
  }

  return data;
}

export async function checkSchemaExists(): Promise<{ exists: boolean }> {
  const response = await fetch(`${API_BASE_URL}/schema/exists`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to check schema');
  }

  return data;
}

export async function extractSchema(force?: boolean): Promise<{ success: boolean; message: string; schema?: { tables: unknown[] } }> {
  const response = await fetch(`${API_BASE_URL}/schema/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ force }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to extract schema');
  }

  return data;
}

export async function getRules(): Promise<{ content: string }> {
  const response = await fetch(`${API_BASE_URL}/rules`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to get rules');
  }

  return data;
}

export async function updateRules(content: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to update rules');
  }

  return data;
}

export async function getMemoryQueries(): Promise<{ queries: QueryMemoryEntry[]; count: number }> {
  const response = await fetch(`${API_BASE_URL}/memory`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to get memory queries');
  }

  return data;
}

export async function deleteMemoryQuery(id: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/memory/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to delete query');
  }

  return data;
}

export async function initializeSystem(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to initialize system');
  }

  return data;
}
