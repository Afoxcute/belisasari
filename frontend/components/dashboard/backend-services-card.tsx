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
      icon: <Zap className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      key: 'patternRecognition' as keyof ServiceStatus,
      name: 'Pattern Recognition',
      description: 'AI-powered pattern detection',
      icon: <Brain className="h-5 w-5" />,
      color: 'text-purple-600'
    },
    {
      key: 'bitquery' as keyof ServiceStatus,
      name: 'Jupiter Token & Price Data',
      description: 'Jupiter quotes → tokens & prices',
      icon: <Database className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      key: 'decisionAgent' as keyof ServiceStatus,
      name: 'Decision Agent',
      description: 'Real-time decision making',
      icon: <Target className="h-5 w-5" />,
      color: 'text-orange-600'
    }
  ];

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Active
      </Badge>
    ) : (
      <Badge variant="destructive">
        Inactive
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Backend Services</CardTitle>
              <CardDescription>
                Manage and monitor backend services
              </CardDescription>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkServiceStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              onClick={startAllServices}
              disabled={isRunning}
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Starting...' : 'Start All'}
            </Button>
          </div>
        </div>
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Last checked: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Service Status</TabsTrigger>
            <TabsTrigger value="logs">Service Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div key={service.key} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={service.color}>
                        {service.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    {getStatusIcon(serviceStatus[service.key])}
                  </div>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(serviceStatus[service.key])}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startService(service.key)}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.key} className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={service.color}>
                      {service.icon}
                    </div>
                    <h3 className="font-medium">{service.name}</h3>
                    {getStatusBadge(serviceStatus[service.key])}
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                    {serviceLogs[service.key] ? (
                      <pre className="whitespace-pre-wrap">
                        {serviceLogs[service.key]}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground">
                        No logs available. Start the service to see output.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
