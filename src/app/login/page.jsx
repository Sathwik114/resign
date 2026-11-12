'use client';

import './page.css';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const svg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

const UserIcon = () => (
  <svg {...svg}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
  </svg>
);
const LockIcon = () => (
  <svg {...svg}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
const EyeIcon = ({ off }) => (
  <svg {...svg}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);
const SmallCross = () => (
  <svg {...svg} strokeWidth="3">
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

/* 3D coin: check = login ok, X = wrong password, ! = user not in database */
const Coin = ({ type }) => (
  <div className="coin" aria-hidden="true">
    <div className="coinFace">
      <svg viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {type === 'success' && <path className="coinStroke" d="M18 34l9 9 19-22" />}
        {type === 'wrong' && <path className="coinStroke" d="M21 21l22 22M43 21 21 43" />}
        {type === 'missing' && (
          <>
            <path className="coinStroke" d="M32 17v20" />
            <path className="coinStroke" d="M32 46.5h.01" />
          </>
        )}
      </svg>
    </div>
  </div>
);

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | wrong | missing
  const [errorKind, setErrorKind] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const loading = status === 'loading';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const dismissStatus = () => {
    clearTimeout(timer.current);
    setStatus('idle');
  };

  // Popup that closes by itself or with "Try again"
  // kind: 'wrong' = incorrect password (X), 'missing' = user not in database (!)
  const fail = (message, kind) => {
    setError(message);
    setErrorKind(kind);
    setStatus(kind);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 4500);
  };

  // Plain inline message, no popup (empty fields, network or server errors)
  const failInline = (message) => {
    setError(message);
    setErrorKind('');
    setStatus('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { username, password } = formData;

    if (!username.trim() || !password) {
      failInline('Username and password are required.');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        const notFound = response.status === 404 || data.code === 'USER_NOT_FOUND';
        const wrongPassword = response.status === 401 || data.code === 'INVALID_PASSWORD';
        if (notFound) {
          fail('This username is not registered. Please contact the IT Team.', 'missing');
        } else if (wrongPassword) {
          fail('The password you entered is incorrect. Please try again.', 'wrong');
        } else {
          failInline(data.error || 'Authentication failed. Please try again.');
        }
        return;
      }

      setStatus('success');
      setFormData({ username: '', password: '' });

      const requestedPath = new URLSearchParams(window.location.search).get('next');
      const destination = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/dashboard';
      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 2800);
    } catch (err) {
      console.error(err);
      failInline('An error occurred. Please check your internet connection.');
    }
  };

  const popup = status === 'success' || status === 'wrong' || status === 'missing';
  const locked = loading || status === 'success';

  return (
    <div className="loginPage">
      <div className="loginContainer">
        <div className="loginCard">
          <div className="cardHeader">
            <span className="brandMark" aria-hidden="true">GTI</span>
            <h2 className="cardTitle">Resign &amp; ESI Forms Management System</h2>
          </div>

          {error && !popup && (
            <div className="loginAlert" role="alert">
              <span className="alertIcon"><SmallCross /></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="loginForm" noValidate>
            <div className="loginField">
              <label htmlFor="username">Username</label>
              <div className="inputWrap">
                <span className="inputIcon"><UserIcon /></span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  autoComplete="username"
                  aria-invalid={error ? 'true' : 'false'}
                  disabled={locked}
                />
              </div>
            </div>

            <div className="loginField">
              <label htmlFor="password">Password</label>
              <div className="inputWrap">
                <span className="inputIcon"><LockIcon /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={error && errorKind !== 'missing' ? 'true' : 'false'}
                  disabled={locked}
                />
                <button
                  type="button"
                  className="revealBtn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={locked}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={locked} className="loginButton">
              {loading && <span className="btnSpinner" aria-hidden="true" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      {popup && (
        <div className="modalBackdrop" onClick={status !== 'success' ? dismissStatus : undefined}>
          <div
            className={`modal3d modal3d-${status}`}
            role={status === 'success' ? 'status' : 'alertdialog'}
            aria-modal={status !== 'success' ? 'true' : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <Coin type={status} />
            {status === 'success' && (
              <>
                <h4>Login successful</h4>
                <p>Authentication verified. Redirecting to your dashboard...</p>
                <div className="modalProgress"><span /></div>
              </>
            )}
            {status === 'wrong' && (
              <>
                <h4>Incorrect password</h4>
                <p>{error}</p>
                <button type="button" className="modalRetry" onClick={dismissStatus} autoFocus>
                  Try again
                </button>
              </>
            )}
            {status === 'missing' && (
              <>
                <h4>User not found</h4>
                <p>{error}</p>
                <button type="button" className="modalRetry" onClick={dismissStatus} autoFocus>
                  Try again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}