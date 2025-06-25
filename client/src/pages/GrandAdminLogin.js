import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/grandadmin-login.css';

const API_URL = '/api/auth';

const GrandAdminLogin = () => {
  const navigate = useNavigate();
  // State for login/registration/verification
  const [step, setStep] = useState('login'); // 'login', 'register', 'verify', 'complete', 'profile'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('GRANDADMIN');
  const [regEmail, setRegEmail] = useState('');
  const [regMessage, setRegMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Complete registration
  const [completeName, setCompleteName] = useState('');
  const [completePhone, setCompletePhone] = useState('');
  const [completePassword, setCompletePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [completeToken, setCompleteToken] = useState('');
  const [completeEmail, setCompleteEmail] = useState('');

  // Check if already logged in as GrandAdmin
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      const parsed = JSON.parse(user);
      if (parsed.role === 'GRANDADMIN') {
        navigate('/admin-dashboard');
      }
    }
  }, [navigate]);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, role: loginRole })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        if (loginRole === 'GRANDADMIN') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else if (data.requiresVerification) {
        setStep('verify');
        setError('Verification code sent to your email.');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration (request email verification)
  const handleStartRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRegMessage('');
    setError('');
    try {
      const response = await fetch(`${API_URL}/request-email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail })
      });
      const data = await response.json();
      if (data.success) {
        setRegMessage('Verification email sent! Check your inbox.');
      } else {
        setRegMessage(data.message || 'Registration failed');
      }
    } catch (err) {
      setRegMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code (login)
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, role: loginRole, verificationCode })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/admin-dashboard');
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle complete registration (from email link)
  useEffect(() => {
    // If on /complete-registration?email=...&token=...
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');
    if (window.location.pathname === '/complete-registration' && email && token) {
      setStep('complete');
      setCompleteEmail(email);
      setCompleteToken(token);
    }
  }, []);

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (completePassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: completeEmail,
          name: completeName,
          phone: completePhone,
          role: 'GRANDADMIN',
          password: completePassword,
          token: completeToken
        })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/admin-dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // UI rendering (replicate your HTML/CSS exactly)
  // ... (UI code will be inserted here, see next step) ...

  return (
    <div className="grandadmin-login-bg">
      {/* Login Form */}
      {step === 'login' && (
        <div className="grandadmin-container">
          <div className="header">
            <h1>🔐 GrandAdmin Login</h1>
            <p>Only GrandAdmins can login here</p>
          </div>
          <form className="form-container" onSubmit={handleLogin}>
            {error && <div className="message error">{error}</div>}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Login as</label>
              <select value={loginRole} onChange={e => setLoginRole(e.target.value)} required>
                <option value="GRANDADMIN">Grand Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            <div className="toggle-form">
              <button type="button" onClick={() => setStep('register')}>Register as Grand Admin</button>
            </div>
          </form>
        </div>
      )}
      {/* Registration Form */}
      {step === 'register' && (
        <div className="grandadmin-container">
          <div className="header">
            <h1>Register as Grand Admin</h1>
            <p>Enter your email to start registration</p>
          </div>
          <form className="form-container" onSubmit={handleStartRegistration}>
            {regMessage && <div className="message success">{regMessage}</div>}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Start Registration'}</button>
            <button className="btn btn-secondary" type="button" onClick={() => setStep('login')}>Back to Login</button>
          </form>
        </div>
      )}
      {/* Verification Step */}
      {step === 'verify' && (
        <div className="grandadmin-container">
          <div className="header">
            <h1>Enter Verification Code</h1>
            <p>Check your email for a 6-digit code</p>
          </div>
          <form className="form-container" onSubmit={handleVerifyCode}>
            {error && <div className="message error">{error}</div>}
            <div className="form-group">
              <label>Verification Code</label>
              <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} required maxLength={6} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Login'}</button>
            <button className="btn btn-link" type="button" onClick={() => setStep('login')}>Back to Login</button>
          </form>
        </div>
      )}
      {/* Complete Registration Step */}
      {step === 'complete' && (
        <div className="grandadmin-container">
          <div className="header">
            <div className="success-icon">✅</div>
            <h1>Email Verified!</h1>
            <p>Complete your registration with phone & password</p>
          </div>
          <form className="form-container" onSubmit={handleCompleteRegistration}>
            {error && <div className="message error">{error}</div>}
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={completeName} onChange={e => setCompleteName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={completePhone} onChange={e => setCompletePhone(e.target.value)} required />
            </div>
            <div className="form-group" style={{ display: 'none' }}>
              <label>Register as</label>
              <select value="GRANDADMIN" disabled><option value="GRANDADMIN">Grand Admin</option></select>
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={completePassword} onChange={e => setCompletePassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Completing...' : 'Complete Registration & Login'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default GrandAdminLogin; 