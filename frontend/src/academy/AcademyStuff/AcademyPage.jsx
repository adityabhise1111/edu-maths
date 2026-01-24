import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useStudentAuth } from "../../contexts/StudentAuthContext";
import { academyAPI, examAPI } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorAlert from "../../components/ErrorAlert";
import { LogOut, AlertTriangle, Clipboard, History, FileText } from 'lucide-react';
import ThemeToggle from "../../components/ThemeToggle/ThemeToggle";

const AcademyPage = () => {
  const { academySlug } = useParams();
  const navigate = useNavigate();
  const { student, isAuthenticated, logout } = useStudentAuth();

  // State for academy and exams
  const [academy, setAcademy] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch academy and exams on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch academy details
        const academyResponse = await academyAPI.getBySlug(academySlug);
        if (academyResponse.academy) {
          setAcademy(academyResponse.academy);
        }

        // Fetch exams for this academy with pagination
        const examsResponse = await examAPI.getByAcademy(academySlug, { page: 1, limit: 10 });

        setExams(examsResponse.exams || []);

        // Set pagination metadata
        if (examsResponse.pagination) {
          setCurrentPage(examsResponse.pagination.currentPage);
          setTotalPages(examsResponse.pagination.totalPages);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load academy data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [academySlug]);

  // Load more exams
  const loadMoreExams = async () => {
    if (currentPage >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const examsResponse = await examAPI.getByAcademy(academySlug, { page: nextPage, limit: 10 });

      setExams(prev => [...prev, ...(examsResponse.exams || [])]);

      if (examsResponse.pagination) {
        setCurrentPage(examsResponse.pagination.currentPage);
        setTotalPages(examsResponse.pagination.totalPages);
      }
    } catch (err) {
      console.error("Error loading more exams:", err);
      setError("Failed to load more exams");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleExamClick = (examId) => {
    if (!isAuthenticated) {
      // Redirect to student login
      navigate(`/${academySlug}/login`);
    } else {
      // Go to exam page
      navigate(`/${academySlug}/exam/${examId}`);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload(); // Reload to update UI
  };

  // Show loading
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading academy..." />;
  }

  // Show error
  if (error && !academy) {
    return (
      <div className="page-container">
        <div className="container">
          <ErrorAlert message={error} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Academy Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-purple), var(--primary-purple-dark))',
        padding: 'var(--spacing-3xl) var(--spacing-md)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Theme Toggle and Student Logout Button */}
        <div style={{
          position: 'absolute',
          top: 'var(--spacing-md)',
          right: 'var(--spacing-md)',
          display: 'flex',
          gap: 'var(--spacing-sm)',
          alignItems: 'center'
        }}>
          <ThemeToggle />

          {isAuthenticated && student && (
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <LogOut size={18} strokeWidth={2} className="inline-block mr-2" />
              Logout
            </button>
          )}
        </div>

        <div className="container container--md">
          {academy?.logoUrl && (
            <img
              src={academy.logoUrl}
              alt={academy.name}
              style={{
                maxWidth: '100px',
                maxHeight: '100px',
                marginBottom: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                padding: 'var(--spacing-xs)',
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: 'var(--spacing-md)',
          }}>
            {academy?.name || academySlug}
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: '0.9', maxWidth: '600px', margin: '0 auto' }}>
            {academy?.description || 'Welcome to our learning platform. Access your exams and track your progress.'}
          </p>

          {/* Show login button or welcome message */}
          {!isAuthenticated ? (
            <button
              onClick={() => navigate(`/${academySlug}/login`)}
              className="btn btn-secondary"
              style={{
                backgroundColor: 'white',
                color: 'var(--primary-purple)',
                marginTop: 'var(--spacing-lg)',
              }}
            >
              Student Login
            </button>
          ) : (
            <p style={{
              marginTop: 'var(--spacing-lg)',
              fontSize: '1rem',
              opacity: '0.9',
            }}>
              👋 Welcome back, <strong>{student?.username}</strong>!
            </p>
          )}
        </div>
      </div>

      {/* Academy Description */}
      <div className="py-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="card animate-fade-in">
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              About This Academy
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.7',
              fontSize: '1rem'
            }}>
              This academy offers comprehensive online assessments designed to test and improve your mathematical skills.
              Sign in as a student to access available exams and track your performance over time.
            </p>
          </div>
        </div>
      </div>

      {/* Exams Section */}
      <div className="py-6">
        <div className="container">
          <div className="mb-5">
            <h2 className="section-title">Available Exams</h2>
            <p className="section-subtitle">
              Click on an exam to get started
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-6">
              <div style={{
                display: 'inline-block',
                width: '48px',
                height: '48px',
                border: '4px solid var(--neutral-200)',
                borderTopColor: 'var(--primary-purple)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                Loading exams...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="card" style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              color: '#c33'
            }}>
              <p>
                <AlertTriangle size={16} strokeWidth={2} className="inline-block mr-2" />
                {error}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && exams.length === 0 && (
            <div className="card text-center">
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                <Clipboard size={20} strokeWidth={2} className="inline-block mr-2" />
                No exams available yet. Check back later!
              </p>
            </div>
          )}

          {/* Exam Cards Grid */}
          {!loading && !error && exams.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {exams.map((exam) => {
                // Determine exam status
                const now = new Date();
                const startTime = new Date(exam.startTime);
                const endTime = new Date(exam.endTime);

                let status = 'upcoming';
                let statusBg = 'var(--neutral-300)';
                let statusColor = 'var(--neutral-700)';

                if (now >= startTime && now <= endTime) {
                  status = 'active';
                  statusBg = 'var(--primary-purple)';
                  statusColor = 'white';
                } else if (now > endTime) {
                  status = 'ended';
                  statusBg = 'var(--neutral-400)';
                  statusColor = 'var(--neutral-800)';
                }

                return (
                  <div
                    key={exam.id}
                    className="card card--interactive stagger-item"
                    onClick={() => status === 'active' ? handleExamClick(exam.id) : null}
                    style={{
                      cursor: status === 'active' ? 'pointer' : 'not-allowed',
                      opacity: status === 'ended' ? '0.6' : '1'
                    }}
                  >
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: statusBg,
                        color: statusColor,
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {status}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      marginBottom: 'var(--spacing-sm)',
                      color: 'var(--text-primary)'
                    }}>
                      {exam.title}
                    </h3>

                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      Difficulty: <strong style={{ textTransform: 'capitalize' }}>{exam.difficulty}</strong>
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: 'var(--spacing-md)',
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <History size={16} strokeWidth={2} />
                        {exam.durationMinutes} mins
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FileText size={16} strokeWidth={2} />
                        {exam.totalQuestions} questions
                      </span>
                    </div>

                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      <div>Start: {new Date(exam.startTime).toLocaleString()}</div>
                      <div>End: {new Date(exam.endTime).toLocaleString()}</div>
                    </div>

                    <div className="mt-4">
                      <button
                        className="btn btn-primary btn-full btn-sm"
                        disabled={status !== 'active'}
                      >
                        {status === 'active'
                          ? (isAuthenticated ? 'Take Exam' : 'Login to Take Exam')
                          : status === 'upcoming'
                            ? 'Not Started Yet'
                            : 'Exam Ended'
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {!loading && !error && exams.length > 0 && currentPage < totalPages && (
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
              <button
                onClick={loadMoreExams}
                disabled={loadingMore}
                className="btn btn-outline"
                style={{ minWidth: '200px' }}
              >
                {loadingMore ? 'Loading...' : `Load More (Page ${currentPage + 1} of ${totalPages})`}
              </button>
            </div>
          )}

          {/* Pagination Info */}
          {!loading && !error && exams.length > 0 && (
            <div style={{
              textAlign: 'center',
              marginTop: 'var(--spacing-md)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem'
            }}>
              Showing {exams.length} exams (Page {currentPage} of {totalPages})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademyPage;

