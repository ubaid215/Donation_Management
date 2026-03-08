/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import webhookService from '../services/webhook.service';

const WebhookContext = createContext();

export const useWebhook = () => {
  const context = useContext(WebhookContext);
  if (!context) {
    throw new Error('useWebhook must be used within a WebhookProvider');
  }
  return context;
};

export const WebhookProvider = ({ children }) => {
  const [stats, setStats] = useState({
    pending: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    total: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [webhookInfo, setWebhookInfo] = useState({
    url: '/webhook/whatsapp',
    verifyToken: 'Not configured',
    isActive: true,
    lastWebhook: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  
  // Use refs to prevent infinite loops
  const isMounted = useRef(true);
  const fetchingRef = useRef(false);
  const initialFetchDone = useRef(false);

  // Fetch webhook status
  const fetchWebhookStatus = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      console.log('Fetching webhook status...');
      
      const response = await webhookService.getWebhookStatus();
      console.log('Webhook status response:', response);
      
      // Only update state if component is still mounted
      if (isMounted.current && response) {
        if (response.success === true) {
          setStats(response.stats || {
            pending: 0,
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
            total: 0
          });
          setRecentActivity(response.recentActivity || []);
          setWebhookInfo(response.webhook || {
            url: '/webhook/whatsapp',
            verifyToken: 'Not configured',
            isActive: true,
            lastWebhook: null
          });
          setLastUpdated(new Date());
          setError(null);
          console.log('Webhook status updated successfully');
        } else {
          console.warn('Webhook status returned unsuccessful:', response);
          setError(response?.error || 'Failed to fetch webhook status');
        }
      }
    } catch (err) {
      console.error('Error in fetchWebhookStatus:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to fetch webhook status');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, []);

  // Initial fetch - only once
  useEffect(() => {
    isMounted.current = true;
    
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchWebhookStatus();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchWebhookStatus]);

  // Auto refresh effect - separate from initial fetch
  useEffect(() => {
    let interval;
    
    if (autoRefresh && initialFetchDone.current) {
      interval = setInterval(() => {
        // Only fetch if not already fetching
        if (!fetchingRef.current) {
          fetchWebhookStatus();
        }
      }, refreshInterval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, refreshInterval, fetchWebhookStatus]);

  // Get message details
  const getMessageDetails = useCallback(async (messageId) => {
    try {
      const response = await webhookService.getMessageDetails(messageId);
      
      if (response && response.success) {
        return response;
      } else {
        throw new Error(response?.error || 'Failed to fetch message details');
      }
    } catch (err) {
      console.error('Error fetching message details:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Get message timeline
  const getMessageTimeline = useCallback(async (donationId) => {
    try {
      const response = await webhookService.getMessageTimeline(donationId);
      return response || [];
    } catch (err) {
      console.error('Error fetching timeline:', err);
      return [];
    }
  }, []);

  // Test webhook
  const testWebhook = useCallback(async (payload) => {
    try {
      const response = await webhookService.testWebhook(payload);
      
      if (response && response.success) {
        return response;
      } else {
        throw new Error(response?.error || 'Failed to test webhook');
      }
    } catch (err) {
      console.error('Error testing webhook:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Toggle auto refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Change refresh interval
  const changeRefreshInterval = useCallback((interval) => {
    setRefreshInterval(interval);
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (!fetchingRef.current) {
      fetchWebhookStatus();
    }
  }, [fetchWebhookStatus]);

  const value = {
    stats,
    recentActivity,
    webhookInfo,
    loading,
    error,
    lastUpdated,
    autoRefresh,
    refreshInterval,
    fetchWebhookStatus: refresh, // Use refresh instead of direct fetch
    getMessageDetails,
    getMessageTimeline,
    testWebhook,
    clearError,
    toggleAutoRefresh,
    changeRefreshInterval
  };

  return (
    <WebhookContext.Provider value={value}>
      {children}
    </WebhookContext.Provider>
  );
};