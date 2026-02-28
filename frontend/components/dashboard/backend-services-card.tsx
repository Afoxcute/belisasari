'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackendIntegrationService } from '@/lib/services/backend-integration-service';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Brain,
  Database,
  Target,
  Zap,
  Activity
} from 'lucide-react';

interface BackendServicesCardProps {
  className?: string;
}

interface ServiceStatus {
  adkWorkflow: boolean;
  patternRecognition: boolean;
  bitquery: boolean;
  decisionAgent: boolean;
}

export function BackendServicesCard({ className }: BackendServicesCardProps) {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    adkWorkflow: false,
    patternRecognition: false,
    bitquery: false,
    decisionAgent: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [serviceLogs, setServiceLogs] = useState<{
    adkWorkflow?: string;
    patternRecognition?: string;
    bitquery?: string;
    decisionAgent?: string;
  }>({});
  const [activeTab, setActiveTab] = useState('status');

  // Check service status
  const checkServiceStatus = async () => {
    setIsLoading(true);
    try {
      const status = await BackendIntegrationService.getServiceStatus();
      setServiceStatus(status);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to check service status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start individual service
  const startService = async (serviceName: keyof ServiceStatus) => {
    setIsRunning(true);
    try {
      let response;
      switch (serviceName) {
        case 'adkWorkflow':
          response = await BackendIntegrationService.startADKWorkflow();
          break;
        case 'patternRecognition':
          response = await BackendIntegrationService.startPatternRecognition();
          break;
        case 'bitquery':
          response = await BackendIntegrationService.startJupiterPriceSync();
          break;
        case 'decisionAgent':
          response = await BackendIntegrationService.startDecisionAgent();
          break;
      }

      if (response) {
        setServiceLogs(prev => ({
          ...prev,
          [serviceName]: response.output || response.message
        }));
        
        // Check status after starting service
        await checkServiceStatus();
      }
    } catch (error) {
      console.error(`Failed to start ${serviceName}:`, error);
    } finally {
      setIsRunning(false);
    }
  };

  // Start all services
  const startAllServices = async () => {
    setIsRunning(true);
    try {
      const responses = await BackendIntegrationService.startAllServices();
      
      setServiceLogs({
        adkWorkflow: responses.adkWorkflow.output || responses.adkWorkflow.message,
        patternRecognition: responses.patternRecognition.output || responses.patternRecognition.message,
        bitquery: responses.bitquery.output || responses.bitquery.message,
        decisionAgent: responses.decisionAgent.output || responses.decisionAgent.message
      });

      // Check status after starting all services
      await checkServiceStatus();
    } catch (error) {
      console.error('Failed to start all services:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Check status on component mount
  useEffect(() => {
    checkServiceStatus();
  }, []);

  const services = [
    {
      key: 'adkWorkflow' as keyof ServiceStatus,
      name: 'ADK Workflow',
      description: 'Multi-agent workflow orchestrator',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      key: 'patternRecognition' as keyof ServiceStatus,
      name: 'Pattern Recognition',
      description: 'AI-powered pattern detection',
      icon: <Brain className="h-4 w-4" />,
    },
    {
      key: 'bitquery' as keyof ServiceStatus,
      name: 'Jupiter Token & Price Data',
      description: 'Jupiter quotes → tokens & prices',
      icon: <Database className="h-4 w-4" />,
    },
    {
      key: 'decisionAgent' as keyof ServiceStatus,
      name: 'Decision Agent',
      description: 'Real-time decision making',
      icon: <Target className="h-4 w-4" />,
    }
  ];

  const tabs = [
    { key: 'status', label: 'Service Status' },
    { key: 'logs', label: 'Service Logs' },
  ];

  return (
    <div className={`dash-card ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--dash-white)' }}>
          Backend Services
        </span>
        <div className="flex items-center gap-2">
          <button
            className="dash-play-btn"
            onClick={checkServiceStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            className="dash-btn-cyan"
            onClick={startAllServices}
            disabled={isRunning}
          >
            <Play className="h-3.5 w-3.5" />
            {isRunning ? 'Starting...' : 'Start All'}
          </button>
        </div>
      </div>
      {lastUpdate && (
        <p style={{ fontSize: 11, color: 'var(--dash-muted)', marginBottom: 12 }}>
          Last checked: {lastUpdate.toLocaleTimeString()}
        </p>
      )}

      {/* Tab bar */}
      <div className="flex gap-0 border-b" style={{ borderColor: 'var(--dash-border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`dash-tab ${activeTab === tab.key ? 'dash-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'status' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map((service) => {
              const isActive = serviceStatus[service.key];
              return (
                <div
                  key={service.key}
                  className={`dash-service-card ${isActive ? 'dash-service-card--active' : 'dash-service-card--inactive'}`}
                >
                  {/* Status badge + live dot */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`dash-badge ${isActive ? 'dash-badge--active' : 'dash-badge--inactive'}`}>
                      <span className={`dash-pulse-dot ${isActive ? 'dash-pulse-dot--green' : 'dash-pulse-dot--red'}`}
                        style={{ width: 6, height: 6 }}
                      />
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className={`dash-pulse-dot ${isActive ? 'dash-pulse-dot--green' : 'dash-pulse-dot--red'}`} />
                  </div>

                  {/* Service info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--dash-white)' }}>
                        {service.name}
                      </h3>
                      <p style={{ fontSize: 13, color: isActive ? 'var(--dash-green)' : 'var(--dash-red)', marginTop: 2 }}>
                        {isActive ? 'Active' : 'Inactive'}
                      </p>
                      {lastUpdate && (
                        <p style={{ fontSize: 11, color: 'var(--dash-muted)', marginTop: 4 }}>
                          Last checked {lastUpdate.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <button
                      className="dash-play-btn"
                      onClick={() => startService(service.key)}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-3">
            {services.map((service) => {
              const isActive = serviceStatus[service.key];
              return (
                <div key={service.key} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--dash-border)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: 'var(--dash-white)' }}>{service.icon}</span>
                    <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--dash-white)' }}>{service.name}</h3>
                    <span className={`dash-badge ${isActive ? 'dash-badge--active' : 'dash-badge--inactive'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="p-2 rounded" style={{
                    background: 'rgba(0,0,0,0.3)',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    maxHeight: 128,
                    overflowY: 'auto',
                    color: 'var(--dash-muted)'
                  }}>
                    {serviceLogs[service.key] ? (
                      <pre className="whitespace-pre-wrap" style={{ color: 'var(--dash-green)' }}>
                        {serviceLogs[service.key]}
                      </pre>
                    ) : (
                      <p>No logs available. Start the service to see output.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
