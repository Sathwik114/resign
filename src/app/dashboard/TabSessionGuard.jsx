'use client';

import { useEffect, useRef, useState } from 'react';
import { TAB_SESSION_KEY } from '../tab-session';

export default function TabSessionGuard({ children }) {
  const [status, setStatus] = useState('checking');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const enforceTabSession = async () => {
      try {
        if (window.sessionStorage.getItem(TAB_SESSION_KEY) === 'authenticated') {
          setStatus('authenticated');
          return;
        }
      } catch (error) {
        console.error('Unable to read the tab session:', error);
      }

      try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (!response.ok) {
          throw new Error('The server could not end the session for this tab.');
        }
        window.location.replace('/login');
      } catch (error) {
        console.error('Unable to end the session for this tab:', error);
        setStatus('error');
      }
    };

    void enforceTabSession();
  }, []);

  if (status === 'authenticated') return children;

  return (
    <main role="alert" style={{ margin: 'auto', padding: 24, textAlign: 'center' }}>
      {status === 'error'
        ? 'Unable to verify this tab session. Refresh the page to try again.'
        : 'Checking your session...'}
    </main>
  );
}
