import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teacherAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import DashboardLayout from './DashboardLayout/DashboardLayout';
import { Skeleton, SkeletonText, SkeletonTable, SkeletonAvatar } from '../components/Skeleton';

const StudentPerformanceDetails = () => {
    const { academySlug, studentId } = useParams();
    const navigate = useNavigate();
    const { isLoaded, isSignedIn } = useAuth();

    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/login');
        }
    }, [isLoaded, isSignedIn, navigate]);

    // Fetch student performance data
    useEffect(() => {
        if (!isSignedIn || !studentId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await teacherAPI.getStudentPerformanceDetails(studentId);
                setStudentData(response);
            } catch (err) {
                console.error('Error fetching student performance:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load student performance');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isSignedIn, studentId]);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Not submitted';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get difficulty badge color
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy':
                return { color: 'var(--success)', bg: 'var(--success-light)' };
            case 'medium':
                return { color: 'var(--warning-dark)', bg: 'var(--warning-light)' };
            case 'hard':
                return { color: 'var(--error)', bg: 'var(--error-light)' };
            default:
                return { color: 'var(--text-secondary)', bg: 'var(--neutral-100)' };
        }
    };

    // Get score color
    const getScoreColor = (score) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 60) return 'var(--warning-dark)';
        if (score >= 40) return 'var(--warning-dark)';
        return 'var(--error)';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ minHeight: 'calc(100vh - 120px)', backgroundColor: 'var(--bg-secondary)', padding: 'var(--spacing-xl)' }}>
                    {/* Header Skeleton */}
                    <div className="card animate-fade-in" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        {/* Breadcrumb Skeleton */}
                        <Skeleton width="200px" height="14px" style={{ marginBottom: 'var(--spacing-md)' }} />

                        {/* Title Section Skeleton */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                            <SkeletonAvatar size="64px" />
                            <div style={{ flex: 1 }}>
                                <Skeleton width="180px" height="30px" style={{ marginBottom: 'var(--spacing-sm)' }} />
                                <Skeleton width="120px" height="16px" />
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards Skeleton */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-lg)',
                        marginBottom: 'var(--spacing-xl)'
                    }} className="animate-fade-in">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card">
                                <Skeleton width="100px" height="14px" style={{ marginBottom: 'var(--spacing-sm)' }} />
                                <Skeleton width="80px" height="32px" />
                            </div>
                        ))}
                    </div>

                    {/* Performance Table Skeleton */}
                    <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)' }}>
                            <Skeleton width="200px" height="24px" />
                        </div>
                        <SkeletonTable rows={5} columns={5} />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!studentData) {
        return (
            <DashboardLayout>
                <ErrorAlert message="Student data not found" />
            </DashboardLayout>
        );
    }

    const { studentUsername, overallStats, performances } = studentData;

    return (
        <DashboardLayout>
            <div style={{ minHeight: 'calc(100vh - 120px)', backgroundColor: 'var(--bg-secondary)', padding: 'var(--spacing-xl)' }}>
                {/* Header */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-xl)',
                    marginBottom: 'var(--spacing-xl)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                    {/* Breadcrumb */}
                    <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--spacing-md)'
                    }}>
                        <span
                            onClick={() => navigate(`/${academySlug}/dashboard`)}
                            style={{ color: 'var(--primary-purple)', cursor: 'pointer' }}
                        >
                            Dashboard
                        </span>
                        {' / '}
                        <span
                            onClick={() => navigate(`/${academySlug}/students`)}
                            style={{ color: 'var(--primary-purple)', cursor: 'pointer' }}
                        >
                            Students
                        </span>
                        {' / '}
                        <span>{studentUsername}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                backgroundColor: 'var(--primary-purple)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '2rem',
                                fontWeight: '700'
                            }}>
                                {studentUsername.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                    {studentUsername}
                                </h1>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                    Performance Overview
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/${academySlug}/students`)}
                            className="btn btn-outline"
                        >
                            ← Back to Students
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 'var(--spacing-md)',
                        marginTop: 'var(--spacing-xl)'
                    }}>
                        <div style={{
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--neutral-200)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
                                Total Attempted
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-purple)' }}>
                                {overallStats.totalExamsAttempted}
                            </div>
                        </div>

                        <div style={{
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--neutral-200)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
                                Submitted
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
                                {overallStats.totalExamsSubmitted}
                            </div>
                        </div>

                        <div style={{
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--neutral-200)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
                                Average Score
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: getScoreColor(overallStats.averageScore) }}>
                                {overallStats.averageScore > 0 ? `${overallStats.averageScore}%` : '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {error && <ErrorAlert message={error} />}

                {/* Exam Performance History */}
                <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: 'var(--spacing-lg)' }}>
                        Exam Performance History
                    </h2>

                    {performances.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📝</div>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                No exam attempts yet
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--neutral-200)' }}>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase'
                                        }}>
                                            Exam
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase'
                                        }}>
                                            Difficulty
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase'
                                        }}>
                                            Questions
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase'
                                        }}>
                                            Score
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase'
                                        }}>
                                            Submitted At
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {performances.map((perf, index) => {
                                        const difficultyStyle = getDifficultyColor(perf.difficulty);
                                        const isSubmitted = perf.submittedAt !== null;

                                        return (
                                            <tr
                                                key={index}
                                                onClick={() => isSubmitted && navigate(`/${academySlug}/dashboard/exams/${perf.examId}/student/${studentId}`)}
                                                style={{
                                                    borderBottom: '1px solid var(--neutral-200)',
                                                    transition: 'background-color 0.2s',
                                                    cursor: isSubmitted ? 'pointer' : 'default',
                                                    opacity: isSubmitted ? 1 : 0.6
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    fontWeight: '600',
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    {perf.examTitle}
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    textAlign: 'center'
                                                }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: 'var(--radius-full)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        color: difficultyStyle.color,
                                                        backgroundColor: difficultyStyle.bg,
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {perf.difficulty}
                                                    </span>
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    fontSize: '0.875rem',
                                                    color: 'var(--text-secondary)',
                                                    textAlign: 'center'
                                                }}>
                                                    {perf.totalQuestions}
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    textAlign: 'center'
                                                }}>
                                                    {isSubmitted ? (
                                                        <span style={{
                                                            fontSize: '1.125rem',
                                                            fontWeight: '700',
                                                            color: getScoreColor(perf.score)
                                                        }}>
                                                            {perf.score}%
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: 'var(--radius-full)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            color: 'var(--warning-dark)',
                                                            backgroundColor: 'var(--warning-light)'
                                                        }}>
                                                            In Progress
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    fontSize: '0.875rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {formatDate(perf.submittedAt)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentPerformanceDetails;
