interface InteractionEvent {
  type: 'click' | 'navigation' | 'form_input' | 'error' | 'success' | 'view';
  target?: string;
  timestamp: number;
  pageId: string;
  componentId?: string;
  sessionId: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface InteractionSession {
  sessionId: string;
  startTime: number;
  userId?: string;
  userAgent: string;
  screenSize: {
    width: number;
    height: number;
  };
  events: InteractionEvent[];
  completed: boolean;
}

class InteractionRecorder {
  private static instance: InteractionRecorder;
  private isRecording: boolean = false;
  private currentSession: InteractionSession | null = null;
  private storageKey: string = 'usability_testing_sessions';
  private maxStorageSize: number = 50 * 1024 * 1024; // 50MB
  private autoSaveInterval: number = 30000; // 30 seconds
  private intervalId?: number;
  private debugMode: boolean = false;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  static getInstance(): InteractionRecorder {
    if (!InteractionRecorder.instance) {
      InteractionRecorder.instance = new InteractionRecorder();
    }
    return InteractionRecorder.instance;
  }
  
  /**
   * Start recording a new session
   */
  startSession(userId?: string): string {
    if (this.isRecording) {
      this.endSession();
    }
    
    const sessionId = this.generateSessionId();
    
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      userId,
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      events: [],
      completed: false
    };
    
    this.isRecording = true;
    
    // Set up auto-save
    this.intervalId = window.setInterval(() => {
      this.saveCurrentSession();
    }, this.autoSaveInterval);
    
    // Set up event listeners
    this.setupEventListeners();
    
    this.debugLog('Session started', sessionId);
    
    return sessionId;
  }
  
  /**
   * End the current recording session
   */
  endSession(): void {
    if (!this.isRecording || !this.currentSession) {
      return;
    }
    
    this.currentSession.completed = true;
    this.saveCurrentSession();
    this.isRecording = false;
    this.currentSession = null;
    
    // Clear auto-save interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Remove event listeners
    this.removeEventListeners();
    
    this.debugLog('Session ended');
  }
  
  /**
   * Record a specific interaction event
   */
  recordEvent(
    type: InteractionEvent['type'],
    pageId: string,
    options?: {
      target?: string;
      componentId?: string;
      duration?: number;
      metadata?: Record<string, any>;
    }
  ): void {
    if (!this.isRecording || !this.currentSession) {
      this.debugLog('Cannot record event: No active session');
      return;
    }
    
    const event: InteractionEvent = {
      type,
      target: options?.target,
      timestamp: Date.now(),
      pageId,
      componentId: options?.componentId,
      sessionId: this.currentSession.sessionId,
      duration: options?.duration,
      metadata: options?.metadata
    };
    
    this.currentSession.events.push(event);
    this.debugLog('Event recorded', event);
    
    // If we have too many events, save to prevent memory issues
    if (this.currentSession.events.length > 100) {
      this.saveCurrentSession();
    }
  }
  
  /**
   * Save the current session to local storage
   */
  private saveCurrentSession(): void {
    if (!this.currentSession) {
      return;
    }
    
    try {
      // Get existing sessions
      const existingSessions = this.getSavedSessions();
      
      // Add or update current session
      const sessionIndex = existingSessions.findIndex(
        s => s.sessionId === this.currentSession?.sessionId
      );
      
      if (sessionIndex !== -1) {
        existingSessions[sessionIndex] = this.currentSession;
      } else {
        existingSessions.push(this.currentSession);
      }
      
      // Ensure we don't exceed storage limits
      while (this.getStorageSize(existingSessions) > this.maxStorageSize && existingSessions.length > 1) {
        // Remove oldest session
        existingSessions.sort((a, b) => a.startTime - b.startTime);
        existingSessions.shift();
      }
      
      // Save to local storage
      localStorage.setItem(this.storageKey, JSON.stringify(existingSessions));
      this.debugLog('Session saved to storage');
    } catch (error) {
      console.error('Failed to save interaction session:', error);
    }
  }
  
  /**
   * Retrieve saved sessions from local storage
   */
  getSavedSessions(): InteractionSession[] {
    try {
      const sessionsJson = localStorage.getItem(this.storageKey);
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (error) {
      console.error('Failed to retrieve saved sessions:', error);
      return [];
    }
  }
  
  /**
   * Export session data as JSON
   */
  exportSessionData(sessionId?: string): string {
    const sessions = sessionId
      ? this.getSavedSessions().filter(s => s.sessionId === sessionId)
      : this.getSavedSessions();
    
    return JSON.stringify(sessions, null, 2);
  }
  
  /**
   * Clear all saved sessions
   */
  clearAllSessions(): void {
    localStorage.removeItem(this.storageKey);
    this.debugLog('All sessions cleared');
  }
  
  /**
   * Enable or disable debug logging
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Calculate the size of the sessions in storage
   */
  private getStorageSize(sessions: InteractionSession[]): number {
    return new Blob([JSON.stringify(sessions)]).size;
  }
  
  /**
   * Set up global event listeners
   */
  private setupEventListeners(): void {
    document.addEventListener('click', this.handleDocumentClick);
    window.addEventListener('popstate', this.handleNavigation);
    window.addEventListener('error', this.handleError);
  }
  
  /**
   * Remove global event listeners
   */
  private removeEventListeners(): void {
    document.removeEventListener('click', this.handleDocumentClick);
    window.removeEventListener('popstate', this.handleNavigation);
    window.removeEventListener('error', this.handleError);
  }
  
  /**
   * Handle document click events
   */
  private handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const componentId = this.findComponentId(target);
    const targetInfo = this.getElementInfo(target);
    
    this.recordEvent('click', window.location.pathname, {
      target: targetInfo,
      componentId,
      metadata: {
        x: event.clientX,
        y: event.clientY,
        path: this.getClickPath(target)
      }
    });
  };
  
  /**
   * Handle navigation events
   */
  private handleNavigation = (): void => {
    this.recordEvent('navigation', window.location.pathname, {
      metadata: {
        url: window.location.href
      }
    });
  };
  
  /**
   * Handle error events
   */
  private handleError = (event: ErrorEvent): void => {
    this.recordEvent('error', window.location.pathname, {
      metadata: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  };
  
  /**
   * Try to identify a component ID from data attributes
   */
  private findComponentId(element: HTMLElement | null): string | undefined {
    if (!element) return undefined;
    
    // Check for data attributes
    const dataComponentId = element.getAttribute('data-component-id');
    if (dataComponentId) return dataComponentId;
    
    // Check for id attribute
    const id = element.id;
    if (id) return id;
    
    // Try parent element
    return this.findComponentId(element.parentElement);
  }
  
  /**
   * Get readable information about an element
   */
  private getElementInfo(element: HTMLElement): string {
    if (!element) return 'unknown';
    
    // Try to use meaningful information
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.replace(/ /g, '.')}`;
    
    // Use tag name and text content as fallback
    const tagName = element.tagName.toLowerCase();
    const textContent = element.textContent?.trim().substring(0, 20);
    
    return textContent ? `${tagName}[${textContent}${textContent.length > 20 ? '...' : ''}]` : tagName;
  }
  
  /**
   * Get click path from element to document
   */
  private getClickPath(element: HTMLElement): string[] {
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== document.body) {
      path.push(this.getElementInfo(current));
      current = current.parentElement;
    }
    
    return path;
  }
  
  /**
   * Debug logging
   */
  private debugLog(message: string, data?: any): void {
    if (!this.debugMode) return;
    
    if (data) {
      console.log(`[InteractionRecorder] ${message}:`, data);
    } else {
      console.log(`[InteractionRecorder] ${message}`);
    }
  }
}

export default InteractionRecorder.getInstance(); 