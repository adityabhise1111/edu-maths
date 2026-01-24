import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { teacherAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';
import { SkeletonDashboardStats, SkeletonTable } from '../../components/Skeleton';
import { Users, FileText, ChartNoAxesCombined, Plus, Clipboard } from 'lucide-react';

const TeacherDashboard = () => {
  const { academySlug } = useParams();
  const navigate = useNavigate();
  const { teacher, academy } = useAuth();

  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state for exams
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch exams and students on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch both exams and students in parallel
        const [examsResponse, studentsResponse] = await Promise.all([
          teacherAPI.getAcademyExams({ page: 1, limit: 10 }),
          teacherAPI.getAcademyStudents(),
        ]);

        //console.log("[Teacher dashboard ] exam response", examsResponse );

        setExams(examsResponse.exams || []);
        setStudents(studentsResponse.students || []);

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
  }, []);

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

  // Calculate stats
  const totalStudents = students.length;
  const totalExams = exams.length;
  const totalAttempts = exams.reduce((sum, exam) => sum + (exam.totalAttempts || 0), 0);

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

          {/* Create Exam Button */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <button
              onClick={() => navigate(`/${academySlug}/dashboard/create-exam`)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
            >
              <Plus size={20} strokeWidth={2} />
              Create New Exam
            </button>
          </div>

          {/* Exams List */}
          <div className="card animate-fade-in">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-lg)',
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: '0',
              }}>
                All Exams
              </h2>
            </div>

            {exams.length === 0 ? (
              <EmptyState
                icon={<Clipboard size={48} strokeWidth={1.5} className="text-gray-400" />}
                title="No Exams Yet"
                message="Create your first exam to get started"
                actionLabel="Create Exam"
                onAction={() => navigate(`/${academySlug}/dashboard/create-exam`)}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{
                        textAlign: 'left',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Exam Title
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Difficulty
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem)',
                      }}>
                        Duration
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Start Time
                      </th>
                      <th style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Attempts
                      </th>
                      <th style={{
                        textAlign: 'right',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr
                        key={exam.examId}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: 'var(--spacing-md)' }}>
                          <div style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem',
                          }}>
                            {exam.title}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)',
                          }}>
                            {exam.totalQuestions} questions
                          </div>
                        </td>
                        <td style={{ padding: 'var(--spacing-md)' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor:
                              exam.difficulty === 'easy' ? '#dcfce7' :
                                exam.difficulty === 'medium' ? '#fef3c7' : '#fee2e2',
                            color:
                              exam.difficulty === 'easy' ? '#166534' :
                                exam.difficulty === 'medium' ? '#854d0e' : '#991b1b',
                          }}>
                            {exam.difficulty.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                          {exam.durationMinutes} min
                        </td>
                        <td style={{ padding: 'var(--spacing-md)' }}>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {formatDate(exam.startTime)}
                            <br />
                            {formatTime(exam.startTime)}
                          </div>
                        </td>
                        <td style={{
                          padding: 'var(--spacing-md)',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: 'var(--primary-purple)',
                        }}>
                          {exam.totalAttempts || 0}
                        </td>
                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                          <button
                            onClick={() => navigate(`/${academySlug}/dashboard/exams/${exam.examId}`)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Load More Button */}
            {exams.length > 0 && currentPage < totalPages && (
              <div style={{
                textAlign: 'center',
                marginTop: 'var(--spacing-xl)',
                paddingTop: 'var(--spacing-lg)',
                borderTop: '1px solid var(--border-color)'
              }}>
                <button
                  onClick={loadMoreExams}
                  disabled={loadingMore}
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: loadingMore ? 'var(--text-secondary)' : 'var(--primary-purple)',
                    backgroundColor: 'var(--bg-card)',
                    border: '2px solid var(--primary-purple)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '200px',
                    opacity: loadingMore ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loadingMore) {
                      e.target.style.backgroundColor = 'var(--primary-purple)';
                      e.target.style.color = 'white';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loadingMore) {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.color = 'var(--primary-purple)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }
                  }}
                >
                  {loadingMore ? (
                    <span>⏳ Loading...</span>
                  ) : (
                    <span>📄 Load More Exams • Page {currentPage + 1} of {totalPages}</span>
                  )}
                </button>
              </div>
            )}

            {/* Pagination Info */}
            {exams.length > 0 && (
              <div style={{
                textAlign: 'center',
                marginTop: 'var(--spacing-md)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                📊 Showing {exams.length} exams • Page {currentPage} of {totalPages}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;