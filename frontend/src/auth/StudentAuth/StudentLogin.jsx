import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
import { academyAPI } from '../../services/api';
import { showSuccess, showError } from '../../utils/notifications';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';

const StudentLogin = () => {
  const { academySlug } = useParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, student } = useStudentAuth();

  // Academy state
  const [academy, setAcademy] = useState(null);
  const [academyLoading, setAcademyLoading] = useState(true);
  const [academyError, setAcademyError] = useState('');

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch academy details on mount
  useEffect(() => {
    const fetchAcademy = async () => {
      if (!academySlug) {
        setAcademyError('Invalid academy URL');
        setAcademyLoading(false);
        return;
      }

      try {
        const response = await academyAPI.getBySlug(academySlug);
        if (response.academy) {
          setAcademy(response.academy);
        } else {
          setAcademyError('Academy not found');
        }
      } catch (error) {
        console.error('Failed to fetch academy:', error);
        setAcademyError(error.message || 'Failed to load academy');
      } finally {
        setAcademyLoading(false);
      }
    };

    fetchAcademy();
  }, [academySlug]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && student) {
      // Redirect to academy page (students don't have dashboard)
      navigate(`/${academySlug}`, { replace: true });
    }
  }, [isAuthenticated, student, academySlug, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!username.trim() || !password.trim()) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Call login from StudentAuthContext
      const result = await login(academySlug, username.trim(), password);

      if (result.success) {
        showSuccess('Login successful! Welcome back.');
        // Redirect to academy page
        setTimeout(() => {
          navigate(`/${academySlug}`, { replace: true });
        }, 500);
      } else {
        setError(result.message);
        showError(result.message);
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to login. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while fetching academy
  if (academyLoading) {
    return <LoadingSpinner fullScreen message="Loading academy..." />;
  }

  // Show error if academy not found
  if (academyError || !academy) {
    return (
      <div className="page-container">
        <div className="container container--sm">
          <div className="card animate-fade-in">
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>❌</div>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Academy Not Found</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                {academyError || 'The academy you are looking for does not exist.'}
              </p>
              <Link to="/" className="btn btn-secondary">
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Theme Toggle */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000 }}>
        <ThemeToggle />
      </div>
      
      <div className="container container--sm">
        <div className="card animate-fade-in">
          {/* Academy Info */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
            {academy.logoUrl && (
              <img 
                src={academy.logoUrl} 
                alt={academy.name}
                style={{
                  maxWidth: '80px',
                  maxHeight: '80px',
                  marginBottom: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--primary-purple)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: 'var(--spacing-sm)',
            }}>
              🎓 {academy.name}
            </div>
            {academy.description && (
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.875rem',
                marginTop: 'var(--spacing-sm)',
              }}>
                {academy.description}
              </p>
            )}
          </div>

          {/* Page Title */}
          <h1 className="page-title" style={{ textAlign: 'center' }}>Student Login</h1>
          <p className="page-subtitle" style={{ textAlign: 'center' }}>Sign in to access your exams</p>

          {/* Error Message */}
          {error && (
            <ErrorAlert 
              message={error} 
              onClose={() => setError('')}
            />
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                className="form-input"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-input"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
            >
              {loading ? (
                <>
                  <span style={{ 
                    display: 'inline-block',
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    marginRight: 'var(--spacing-sm)',
                    verticalAlign: 'middle',
                  }} />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Back to Academy Link */}
          <div style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-xl)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--border-color)',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              <Link 
                to={`/${academySlug}`} 
                style={{ 
                  color: 'var(--primary-purple)',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                ← Back to Academy Page
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
