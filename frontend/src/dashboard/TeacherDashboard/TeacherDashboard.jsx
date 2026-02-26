import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { teacherAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';
import { SkeletonDashboardStats, SkeletonTable } from '../../components/Skeleton';
import { Users, FileText, ChartNoAxesCombined, Plus, Clipboard, Clock, ArrowRight, BookOpen } from 'lucide-react';

const TeacherDashboard = () => {
  const { academySlug } = useParams();
  const navigate = useNavigate();
  const { teacher, academy } = useAuth();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard stats - fetched from dedicated optimized API
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    totalExams: 0,
    totalResults: 0,
  });

  // Ref to track if dashboard stats have been fetched (prevents refetch on re-renders)
  const dashboardStatsFetched = useRef(false);

  // Pagination state for exams
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch dashboard stats ONCE on mount (memoized to prevent refetch)
  const fetchDashboardStats = useCallback(async () => {
    // Skip if already fetched
    if (dashboardStatsFetched.current) return;

    try {
      const statsResponse = await teacherAPI.getDashboardStats();
      console.log("[Teacher dashboard] Stats response:", statsResponse);

      setDashboardStats({
        totalStudents: statsResponse.totalStudents || 0,
        totalExams: statsResponse.totalExams || 0,
        totalResults: statsResponse.totalResults || 0,
      });

      // Mark as fetched to prevent refetch
      dashboardStatsFetched.current = true;
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      // Don't set error here - stats are not critical, exams list is more important
    }
  }, []);

  // Fetch exams on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch dashboard stats (optimized counts) and exams in parallel
        // Dashboard stats are fetched only once via ref guard
        const [, examsResponse] = await Promise.all([
          fetchDashboardStats(),
          teacherAPI.getAcademyExams({ page: 1, limit: 10 }),
        ]);

        console.log("[Teacher dashboard] Exam response:", examsResponse);

        setExams(examsResponse.exams || []);

        // Set pagination metadata for exams
        if (examsResponse.pagination) {
          setCurrentPage(examsResponse.pagination.currentPage);
          setTotalPages(examsResponse.pagination.totalPages);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [fetchDashboardStats]);

  // Load more exams
  const loadMoreExams = async () => {
    if (currentPage >= totalPages) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      console.log('🔄 Requesting page:', nextPage);
      console.log('📊 Current state - Page:', currentPage, 'Total exams:', exams.length);

      const examsResponse = await teacherAPI.getAcademyExams({ page: nextPage, limit: 10 });

      console.log('📦 Response received:', examsResponse.exams?.length, 'exams');
      console.log('📄 First new exam ID:', examsResponse.exams?.[0]?.examId);
      console.log('📄 Last new exam ID:', examsResponse.exams?.[examsResponse.exams?.length - 1]?.examId);
      console.log('📄 Current first exam ID:', exams[0]?.examId);
      console.log('📄 Current last exam ID:', exams[exams.length - 1]?.examId);

      const newExams = examsResponse.exams || [];
      console.log('➕ Appending', newExams.length, 'exams to existing', exams.length, 'exams');

      setExams(prev => {
        const combined = [...prev, ...newExams];
        console.log('✅ New total:', combined.length, 'exams');
        return combined;
      });

      if (examsResponse.pagination) {
        console.log('📄 Updating pagination - Current:', examsResponse.pagination.currentPage, 'Total:', examsResponse.pagination.totalPages);
        setCurrentPage(examsResponse.pagination.currentPage);
        setTotalPages(examsResponse.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error loading more exams:', err);
      setError('Failed to load more exams');
    } finally {
      setLoadingMore(false);
    }
  };

  // Use dashboard stats from optimized API (stable - not recalculated on pagination)
  const { totalStudents, totalExams, totalResults: totalAttempts } = dashboardStats;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading skeleton
  if (loading) {
    return (
      <>
        {/* Dashboard Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-pink))',
          padding: 'var(--spacing-2xl) var(--spacing-md)',
          color: 'white'
        }}>
          <div className="container">
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Welcome, {teacher?.firstName || 'Teacher'}! 👋
            </h1>
            <p style={{ fontSize: '1.125rem', opacity: '0.9' }}>
              Managing: <strong>{academy?.name || academySlug}</strong>
            </p>
          </div>
        </div>

        {/* Dashboard Content - Skeleton */}
        <div className="py-6">
          <div className="container">
            {/* Skeleton Stats */}
            <SkeletonDashboardStats />

            {/* Skeleton Create Button */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <div style={{
                width: '200px',
                height: '44px',
                background: 'linear-gradient(90deg, var(--neutral-100) 0%, var(--neutral-200) 50%, var(--neutral-100) 100%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-loading 1.5s ease-in-out infinite',
                borderRadius: 'var(--radius-lg)',
              }} />
            </div>

            {/* Skeleton Exams List */}
            <div className="card animate-fade-in">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)',
              }}>
                <div style={{
                  width: '150px',
                  height: '1.5rem',
                  background: 'linear-gradient(90deg, var(--neutral-100) 0%, var(--neutral-200) 50%, var(--neutral-100) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'skeleton-loading 1.5s ease-in-out infinite',
                  borderRadius: 'var(--radius-md)',
                }} />
              </div>
              <SkeletonTable rows={5} columns={6} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Dashboard Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-pink))',
        padding: 'var(--spacing-2xl) var(--spacing-md)',
        color: 'white'
      }}>
        <div className="container">
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Welcome, {teacher?.firstName || 'Teacher'}! 👋
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: '0.9' }}>
            Managing: <strong>{academy?.name || academySlug}</strong>
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="py-6">
        <div className="container">
          {/* Error Message */}
          {error && (
            <ErrorAlert
              message={error}
              onClose={() => setError('')}
            />
          )}

          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-2xl)',
          }}>
            {/* Students Card */}
            <div className="card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  <Users size={24} strokeWidth={2} color="white" />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '0'
                  }}>
                    {totalStudents}
                  </h3>
                </div>
              </div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Total Students
              </h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                margin: '0'
              }}>
                Enrolled in your academy
              </p>
            </div>

            {/* Exams Card */}
            <div className="card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-pink))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  <FileText size={24} strokeWidth={2} color="white" />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '0'
                  }}>
                    {totalExams}
                  </h3>
                </div>
              </div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Total Exams
              </h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                margin: '0'
              }}>
                Create and manage exams
              </p>
            </div>

            {/* Attempts Card */}
            <div className="card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--accent-teal), #0d9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  <ChartNoAxesCombined size={24} strokeWidth={2} color="white" />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '0'
                  }}>
                    {totalAttempts}
                  </h3>
                </div>
              </div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Total Attempts
              </h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                margin: '0'
              }}>
                Across all exams
              </p>
            </div>
          </div>

          {/* Exams Section Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-lg)',
          }}>
            <div>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: '0 0 0.2rem 0',
                letterSpacing: '-0.01em',
              }}>
                All Exams
              </h2>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {exams.length > 0 ? `${exams.length} exam${exams.length !== 1 ? 's' : ''} in your academy` : 'No exams yet'}
              </p>
            </div>
            <button
              onClick={() => navigate(`/${academySlug}/dashboard/create-exam`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: 'var(--primary-purple)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5b21b6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-purple)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              New Exam
            </button>
          </div>

          {/* Exams Table Card */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            overflow: 'hidden',
          }} className="animate-fade-in">

            {exams.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                gap: '1rem',
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <BookOpen size={24} strokeWidth={1.5} color="var(--text-secondary)" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.375rem 0', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>No exams yet</p>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Create your first exam to get started</p>
                </div>
                <button
                  onClick={() => navigate(`/${academySlug}/dashboard/create-exam`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 1.125rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--primary-purple)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--primary-purple)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    marginTop: '0.25rem',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  Create Exam
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>

                  {/* Table Header */}
                  <thead>
                    <tr style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border-color)',
                    }}>
                      {[['Exam', 'left'], ['Difficulty', 'left'], ['Duration', 'left'], ['Scheduled', 'left'], ['Attempts', 'center'], ['', 'right']].map(([label, align]) => (
                        <th
                          key={label}
                          style={{
                            padding: '0.625rem 1rem',
                            textAlign: align,
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {exams.map((exam, idx) => {
                      const difficultyConfig = {
                        easy: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'Easy' },
                        medium: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Medium' },
                        hard: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', label: 'Hard' },
                      };
                      const diff = difficultyConfig[exam.difficulty] || difficultyConfig.medium;

                      return (
                        <tr
                          key={exam.examId}
                          style={{
                            borderBottom: idx < exams.length - 1 ? '1px solid var(--border-color)' : 'none',
                            transition: 'background-color 0.12s ease',
                            cursor: 'default',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {/* Exam Title + Meta */}
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: '0.1875rem' }}>
                              {exam.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                              <BookOpen size={11} strokeWidth={2} />
                              {exam.totalQuestions} questions
                            </div>
                          </td>

                          {/* Difficulty Badge */}
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.1875rem 0.625rem',
                              borderRadius: '5px',
                              fontSize: '0.6875rem',
                              fontWeight: '600',
                              letterSpacing: '0.03em',
                              backgroundColor: diff.bg,
                              color: diff.color,
                              border: `1px solid ${diff.border}`,
                            }}>
                              {diff.label}
                            </span>
                          </td>

                          {/* Duration */}
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                              <Clock size={13} strokeWidth={2} />
                              {exam.durationMinutes} min
                            </div>
                          </td>

                          {/* Start Time */}
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '500' }}>
                              {formatDate(exam.startTime)}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.125rem' }}>
                              {formatTime(exam.startTime)}
                            </div>
                          </td>

                          {/* Attempts */}
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '2rem',
                              height: '1.75rem',
                              padding: '0 0.5rem',
                              borderRadius: '5px',
                              fontSize: '0.8125rem',
                              fontWeight: '600',
                              color: exam.totalAttempts > 0 ? 'var(--primary-purple)' : 'var(--text-secondary)',
                              backgroundColor: exam.totalAttempts > 0 ? 'rgba(124,58,237,0.08)' : 'var(--bg-secondary)',
                            }}>
                              {exam.totalAttempts || 0}
                            </span>
                          </td>

                          {/* Action */}
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                            <button
                              onClick={() => navigate(`/${academySlug}/dashboard/exams/${exam.examId}`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.375rem 0.875rem',
                                fontSize: '0.8125rem',
                                fontWeight: '500',
                                color: 'var(--text-primary)',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary-purple)';
                                e.currentTarget.style.color = 'var(--primary-purple)';
                                e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.04)';
                                const arrow = e.currentTarget.querySelector('.btn-arrow');
                                if (arrow) arrow.style.transform = 'translateX(2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                                const arrow = e.currentTarget.querySelector('.btn-arrow');
                                if (arrow) arrow.style.transform = 'translateX(0)';
                              }}
                            >
                              View
                              <ArrowRight size={13} strokeWidth={2} className="btn-arrow" style={{ transition: 'transform 0.15s ease' }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Load More */}
            {exams.length > 0 && currentPage < totalPages && (
              <div style={{
                padding: '1rem',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center',
              }}>
                <button
                  onClick={loadMoreExams}
                  disabled={loadingMore}
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: loadingMore ? 'var(--text-secondary)' : 'var(--primary-purple)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: loadingMore ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loadingMore) {
                      e.currentTarget.style.borderColor = 'var(--primary-purple)';
                      e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loadingMore) {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {loadingMore ? 'Loading...' : `Load more  ·  page ${currentPage + 1} of ${totalPages}`}
                </button>
              </div>
            )}

            {/* Footer count */}
            {exams.length > 0 && (
              <div style={{
                padding: '0.625rem 1rem',
                borderTop: exams.length > 0 && currentPage < totalPages ? 'none' : '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textAlign: 'right',
              }}>
                Showing {exams.length} of {totalExams} exam{totalExams !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;