// AlertContext => shared alert state across sidebar and pages
import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchLogs } from '../api';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alertCount, setAlertCount] = useState(0);
  const [alertData, setAlertData] = useState({ logs: [], alerts: [] });

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchLogs();
        setAlertData(res.data);
        setAlertCount(res.data.alert_count || 0);
      } catch (err) {
        console.error('Alert context fetch error:', err);
      }
    };

    doFetch();
    const interval = setInterval(doFetch, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AlertContext.Provider value={{ alertCount, alertData, setAlertData, setAlertCount }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertContext);
}