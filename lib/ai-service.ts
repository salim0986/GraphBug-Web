// AI Service Integration Utility
// Handles communication with the AI service backend

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export interface IngestRequest {
  repo_url: string;
  repo_id: string;
  installation_id: string;
}

export interface QueryRequest {
  repo_id: string;
  query: string;
}

export interface QueryResult {
  score: number;
  name: string;
  file: string;
  code: string;
  start_line: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  services?: {
    neo4j: string;
    qdrant: string;
    parser: string;
  };
}

/**
 * Check if AI service is healthy and responsive
 */
export async function checkAIServiceHealth(): Promise<HealthStatus> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { status: 'error' };
    }

    return await response.json();
  } catch (error) {
    console.error('AI service health check failed:', error);
    return { status: 'error' };
  }
}

/**
 * Trigger ingestion of a repository into AI service
 * This processes the repo and builds knowledge graphs + vector embeddings
 */
export async function ingestRepository(data: IngestRequest): Promise<{ status: string; repo_id: string }> {
  try {
    // Add timeout of 2 minutes for the request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${AI_SERVICE_URL}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Repository ingestion failed:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Ingestion request timed out after 2 minutes');
    }
    throw error;
  }
}

/**
 * Query the AI service for code insights
 */
export async function queryRepository(data: QueryRequest): Promise<{ results: QueryResult[]; count: number }> {
  try {
    // Validate query length
    if (data.query.length > 1000) {
      throw new Error('Query string too long (max 1000 characters)');
    }

    // Add timeout of 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${AI_SERVICE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Repository query failed:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Query request timed out after 30 seconds');
    }
    throw error;
  }
}
