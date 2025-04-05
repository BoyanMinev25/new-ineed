import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import interactionRecorder from './InteractionRecorder';
import UsabilityFeedback from '../../components/UsabilityFeedback';
import { FeedbackData } from '../../components/UsabilityFeedback';

interface UsabilityTestingContextType {
  isTestingActive: boolean;
  currentScenario: string | null;
  currentTaskIndex: number;
  sessionId: string | null;
  startTesting: (userId?: string) => void;
  stopTesting: () => void;
  setScenario: (scenario: string | null) => void;
  nextTask: () => void;
  prevTask: () => void;
  setTaskIndex: (index: number) => void;
  recordEvent: (type: string, metadata?: Record<string, any>) => void;
  logFeedback: (feedback: FeedbackData) => void;
}

const UsabilityTestingContext = createContext<UsabilityTestingContextType | undefined>(undefined);

export interface Scenario {
  id: string;
  name: string;
  tasks: string[];
}

interface UsabilityTestingProviderProps {
  children: ReactNode;
  scenarios?: Scenario[];
  enableByDefault?: boolean;
  feedbackPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  debug?: boolean;
}

export const UsabilityTestingProvider: React.FC<UsabilityTestingProviderProps> = ({
  children,
  scenarios = [],
  enableByDefault = false,
  feedbackPosition = 'bottom-right',
  debug = false,
}) => {
  const [isTestingActive, setIsTestingActive] = useState(enableByDefault);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Get the current scenario object
  const activeScenario = scenarios.find(s => s.id === currentScenario) || null;
  
  // Initialize on mount
  useEffect(() => {
    // Enable debug mode if requested
    if (debug) {
      interactionRecorder.setDebugMode(true);
    }
    
    // Check URL params for testing mode
    const params = new URLSearchParams(window.location.search);
    const testingParam = params.get('usability_testing');
    
    if (testingParam === 'true' && !isTestingActive) {
      startTesting();
    }
    
    setIsReady(true);
  }, []);
  
  // Start a testing session
  const startTesting = (userId?: string) => {
    const newSessionId = interactionRecorder.startSession(userId);
    setSessionId(newSessionId);
    setIsTestingActive(true);
    
    // Log session start
    interactionRecorder.recordEvent('view', window.location.pathname, {
      target: 'session_start',
      metadata: {
        sessionId: newSessionId,
        userId,
      }
    });
    
    // If we have scenarios, start with the first one
    if (scenarios.length > 0 && !currentScenario) {
      setCurrentScenario(scenarios[0].id);
      setCurrentTaskIndex(0);
    }
  };
  
  // Stop the testing session
  const stopTesting = () => {
    if (sessionId) {
      // Log session end
      interactionRecorder.recordEvent('view', window.location.pathname, {
        target: 'session_end',
        metadata: {
          sessionId,
        }
      });
      
      interactionRecorder.endSession();
    }
    
    setIsTestingActive(false);
    setSessionId(null);
  };
  
  // Set the current scenario
  const setScenario = (scenarioId: string | null) => {
    setCurrentScenario(scenarioId);
    
    if (scenarioId) {
      setCurrentTaskIndex(0);
      
      // Log scenario change
      interactionRecorder.recordEvent('view', window.location.pathname, {
        target: 'scenario_change',
        metadata: {
          scenarioId,
          scenarioName: scenarios.find(s => s.id === scenarioId)?.name
        }
      });
    }
  };
  
  // Move to the next task
  const nextTask = () => {
    if (!activeScenario) return;
    
    const newIndex = Math.min(currentTaskIndex + 1, activeScenario.tasks.length - 1);
    setCurrentTaskIndex(newIndex);
    
    // Log task change
    interactionRecorder.recordEvent('view', window.location.pathname, {
      target: 'task_change',
      metadata: {
        scenarioId: currentScenario,
        taskIndex: newIndex,
        taskDescription: activeScenario.tasks[newIndex]
      }
    });
  };
  
  // Move to the previous task
  const prevTask = () => {
    if (!activeScenario) return;
    
    const newIndex = Math.max(currentTaskIndex - 1, 0);
    setCurrentTaskIndex(newIndex);
    
    // Log task change
    interactionRecorder.recordEvent('view', window.location.pathname, {
      target: 'task_change',
      metadata: {
        scenarioId: currentScenario,
        taskIndex: newIndex,
        taskDescription: activeScenario.tasks[newIndex]
      }
    });
  };
  
  // Set task index directly
  const setTaskIndex = (index: number) => {
    if (!activeScenario) return;
    
    const newIndex = Math.max(0, Math.min(index, activeScenario.tasks.length - 1));
    setCurrentTaskIndex(newIndex);
    
    // Log task change
    interactionRecorder.recordEvent('view', window.location.pathname, {
      target: 'task_change',
      metadata: {
        scenarioId: currentScenario,
        taskIndex: newIndex,
        taskDescription: activeScenario.tasks[newIndex]
      }
    });
  };
  
  // Record a custom event
  const recordEvent = (type: string, metadata?: Record<string, any>) => {
    if (!isTestingActive || !sessionId) return;
    
    interactionRecorder.recordEvent('view', window.location.pathname, {
      target: type,
      metadata: {
        ...metadata,
        scenarioId: currentScenario,
        taskIndex: currentTaskIndex,
      }
    });
  };
  
  // Log feedback from the feedback component
  const logFeedback = (feedback: FeedbackData) => {
    if (!isTestingActive || !sessionId) return;
    
    interactionRecorder.recordEvent('view', feedback.pageId, {
      target: 'feedback_submitted',
      componentId: feedback.componentId,
      metadata: {
        ...feedback,
        scenarioId: currentScenario,
        taskIndex: currentTaskIndex,
      }
    });
  };
  
  // Create context value
  const contextValue: UsabilityTestingContextType = {
    isTestingActive,
    currentScenario,
    currentTaskIndex,
    sessionId,
    startTesting,
    stopTesting,
    setScenario,
    nextTask,
    prevTask,
    setTaskIndex,
    recordEvent,
    logFeedback,
  };
  
  // Only render when ready
  if (!isReady) return <>{children}</>;
  
  return (
    <UsabilityTestingContext.Provider value={contextValue}>
      {children}
      
      {isTestingActive && (
        <>
          {/* Task Information */}
          {activeScenario && (
            <div className="usability-testing-task-info">
              <div className="usability-testing-task-info__header">
                <span className="usability-testing-task-info__scenario">
                  {activeScenario.name}
                </span>
                <span className="usability-testing-task-info__task-number">
                  Task {currentTaskIndex + 1} of {activeScenario.tasks.length}
                </span>
              </div>
              
              <div className="usability-testing-task-info__description">
                {activeScenario.tasks[currentTaskIndex]}
              </div>
              
              <div className="usability-testing-task-info__actions">
                {currentTaskIndex > 0 && (
                  <button 
                    className="usability-testing-task-info__prev-btn"
                    onClick={prevTask}
                  >
                    Previous
                  </button>
                )}
                
                {currentTaskIndex < activeScenario.tasks.length - 1 && (
                  <button 
                    className="usability-testing-task-info__next-btn"
                    onClick={nextTask}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Feedback Component */}
          <UsabilityFeedback
            pageId={window.location.pathname}
            componentId={activeScenario?.id}
            onSubmit={logFeedback}
            position={feedbackPosition}
          />
        </>
      )}
    </UsabilityTestingContext.Provider>
  );
};

// Hook for consuming the context
export const useUsabilityTesting = (): UsabilityTestingContextType => {
  const context = useContext(UsabilityTestingContext);
  
  if (context === undefined) {
    throw new Error('useUsabilityTesting must be used within a UsabilityTestingProvider');
  }
  
  return context;
}; 