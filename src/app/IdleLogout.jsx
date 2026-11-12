'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const IDLE_TIMEOUT = 5 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'resign-last-activity';
const LOGOUT_KEY = 'resign-idle-logout';

export default function IdleLogout() {
  const pathname = usePathname();
  const loggingOut = useRef(false);

  useEffect(() => {
    if (pathname === '/login' || pathname === '/signup') return undefined;

    let lastActivity = Date.now();
    let lastPersistedActivity = lastActivity;
    let timeoutId;
    const timerWindow = window;

    const redirectToLogin = () => {
      if (loggingOut.current) return;
      loggingOut.current = true;
      timerWindow.location.replace('/login');
    };

    const logout = async () => {
      if (loggingOut.current) return;
      loggingOut.current = true;
      timerWindow.clearTimeout(timeoutId);
      try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (!response.ok) {
          throw new Error('The server could not complete the idle logout.');
        }
      } catch (error) {
        console.error('Automatic logout failed:', error);
      } finally {
        try {
          timerWindow.localStorage.removeItem(LAST_ACTIVITY_KEY);
          timerWindow.localStorage.setItem(LOGOUT_KEY, String(Date.now()));
        } catch (error) {
          console.error('Unable to synchronize automatic logout across tabs:', error);
        }
        timerWindow.location.replace('/login');
      }
    };

    const scheduleLogout = () => {
      timerWindow.clearTimeout(timeoutId);
      const remaining = IDLE_TIMEOUT - (Date.now() - lastActivity);
      timeoutId = timerWindow.setTimeout(
        () => void (remaining <= 0 ? logout() : scheduleLogout()),
        Math.max(remaining, 0),
      );
    };

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity >= IDLE_TIMEOUT) {
        void logout();
        return;
      }
      lastActivity = now;
      if (now - lastPersistedActivity >= 1000) {
        lastPersistedActivity = now;
        try {
          timerWindow.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        } catch (error) {
          console.error('Unable to synchronize activity across tabs:', error);
        }
      }
      scheduleLogout();
    };

    const handleStorage = (event) => {
      if (event.key === LOGOUT_KEY) {
        redirectToLogin();
        return;
      }
      if (event.key !== LAST_ACTIVITY_KEY || !event.newValue) return;

      const sharedActivity = Number(event.newValue);
      if (!Number.isFinite(sharedActivity)) return;
      if (Date.now() - sharedActivity >= IDLE_TIMEOUT) {
        void logout();
        return;
      }
      lastActivity = Math.max(lastActivity, sharedActivity);
      scheduleLogout();
    };

    lastActivity = Date.now();
    try {
      timerWindow.localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivity));
    } catch (error) {
      console.error('Unable to initialize activity synchronization:', error);
    }

    const activityEvents = ['pointerdown', 'keydown', 'mousemove', 'touchstart', 'scroll', 'wheel'];
    activityEvents.forEach((eventName) => {
      timerWindow.addEventListener(eventName, handleActivity, { passive: true });
    });
    timerWindow.addEventListener('storage', handleStorage);
    scheduleLogout();

    return () => {
      timerWindow.clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        timerWindow.removeEventListener(eventName, handleActivity);
      });
      timerWindow.removeEventListener('storage', handleStorage);
    };
  }, [pathname]);

  return null;
}
