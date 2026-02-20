/**
 * Backend Integration Service
 * 
 * This service provides methods to interact with all backend services
 * including ADK workflow, pattern recognition, decision agent, and Jupiter token/price data.
 */

export interface BackendServiceResponse {
  success: boolean;
  message: string;
  output?: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface ADKWorkflowResponse extends BackendServiceResponse {
  output?: string;
}

export interface PatternRecognitionResponse extends BackendServiceResponse {
  output?: string;
}

export interface DecisionAgentResponse extends BackendServiceResponse {
  output?: string;
}

export class BackendIntegrationService {
  private static baseUrl = '/api';

  /**
   * Start ADK Workflow
   */
  static async startADKWorkflow(): Promise<ADKWorkflowResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/adk-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start ADK workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Start Pattern Recognition
   */
  static async startPatternRecognition(): Promise<PatternRecognitionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/pattern-recognition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start pattern recognition',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Jupiter price sync: fetch prices via Jupiter quote API and store in Supabase.
   */
  static async startJupiterPriceSync(): Promise<BackendServiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/jupiter/sync-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Jupiter price sync failed',
          error: data.error,
          timestamp: new Date().toISOString()
        };
      }
      return {
        success: true,
        message: data.message || `Updated ${data.updated ?? 0} tokens`,
        output: data.message,
        data: data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to run Jupiter price sync',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Start Decision Agent
   */
  static async startDecisionAgent(): Promise<DecisionAgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/decision-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start decision agent',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get Pattern Summary
   */
  static async getPatternSummary(): Promise<BackendServiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/patterns/summary`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch pattern summary',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get Pattern Detections
   */
  static async getPatternDetections(filters: {
    limit?: number;
    patternType?: string;
    tokenSymbol?: string;
    hours?: number;
  } = {}): Promise<BackendServiceResponse> {
    try {
      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.patternType) params.append('pattern_type', filters.patternType);
      if (filters.tokenSymbol) params.append('token_symbol', filters.tokenSymbol);
      if (filters.hours) params.append('hours', filters.hours.toString());

      const response = await fetch(`${this.baseUrl}/patterns/detections?${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch pattern detections',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get Pattern Insights
   */
  static async getPatternInsights(filters: {
    limit?: number;
    insightType?: string;
    tokenSymbol?: string;
    hours?: number;
  } = {}): Promise<BackendServiceResponse> {
    try {
      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.insightType) params.append('insight_type', filters.insightType);
      if (filters.tokenSymbol) params.append('token_symbol', filters.tokenSymbol);
      if (filters.hours) params.append('hours', filters.hours.toString());

      const response = await fetch(`${this.baseUrl}/patterns/insights?${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch pattern insights',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Start All Backend Services
   */
  static async startAllServices(): Promise<{
    adkWorkflow: ADKWorkflowResponse;
    patternRecognition: PatternRecognitionResponse;
    bitquery: BackendServiceResponse; // Jupiter price sync
    decisionAgent: DecisionAgentResponse;
  }> {
    console.log('🚀 Starting all backend services...');

    const [adkWorkflow, patternRecognition, bitquery, decisionAgent] = await Promise.all([
      this.startADKWorkflow(),
      this.startPatternRecognition(),
      this.startJupiterPriceSync(),
      this.startDecisionAgent()
    ]);

    return {
      adkWorkflow,
      patternRecognition,
      bitquery,
      decisionAgent
    };
  }

  /**
   * Get Service Status
   */
  static async getServiceStatus(): Promise<{
    adkWorkflow: boolean;
    patternRecognition: boolean;
    bitquery: boolean;
    decisionAgent: boolean;
  }> {
    try {
      const quoteUrl = `${this.baseUrl}/jupiter/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000`;
      const [adkResponse, patternResponse, jupiterResponse, decisionResponse] = await Promise.all([
        fetch(`${this.baseUrl}/adk-workflow`),
        fetch(`${this.baseUrl}/pattern-recognition`),
        fetch(quoteUrl),
        fetch(`${this.baseUrl}/decision-agent`)
      ]);

      return {
        adkWorkflow: adkResponse.ok,
        patternRecognition: patternResponse.ok,
        bitquery: jupiterResponse.ok,
        decisionAgent: decisionResponse.ok
      };
    } catch (error) {
      console.error('Failed to check service status:', error);
      return {
        adkWorkflow: false,
        patternRecognition: false,
        bitquery: false,
        decisionAgent: false
      };
    }
  }
}
