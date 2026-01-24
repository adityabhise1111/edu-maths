import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teacherAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const TeacherExamMonitoring = () => {
    const { academySlug, examId } = useParams();
    const navigate = useNavigate();
    const { teacher, academy } = useAuth();

    // State
    const [exam, setExam] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch exam attempts and summary
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                // Fetch summary first
                const summaryData = await teacherAPI.getExamSummary(examId);

                // Extract summary stats from the response structure
                const summaryStats = {
                    totalAttempts: summaryData.summary?.totalStudentsAttempted || 0,
                    submittedCount: summaryData.summary?.totalStudentsSubmitted || 0,
                    averageScore: summaryData.summary?.averageScore || 0,
                    highestScore: summaryData.summary?.highestScore,
                    totalQuestions: summaryData.totalQuestions || 0,
                };
                setSummary(summaryStats);

                // Fetch attempts with sorting
                const attemptsData = await teacherAPI.getExamAttempts(examId);

                setExam({
                    id: summaryData.examId,
                    title: summaryData.examTitle,
                });
                setAttempts(attemptsData.attempts || []);

            } catch (err) {
                console.error('Error fetching exam data:', err);
                setError(err.message || 'Failed to load exam data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [examId]);

    // Get status badge
    const getStatusBadge = (attempt) => {
        if (attempt.submittedAt) {
            return {
                text: 'Submitted',
                color: 'var(--success)',
                bgColor: '#f0fdf4',
            };
        } else if (attempt.startedAt) {
            return {
                text: 'In Progress',
                color: '#f97316',
                bgColor: '#fff7ed',
            };
        } else {
            return {
                text: 'Not Started',
                color: 'var(--neutral-500)',
                bgColor: 'var(--neutral-100)',
            };
        }
    };

    //Loading State
    if (loading) {
        return <LoadingSpinner message="Loading exam data..." />;
    }

    // Error State
    if (error) {
        return (
            <div className="page-container">
                <div className="container">
                    <ErrorAlert
                        message={error}
                        onClose={() => navigate(`/${academySlug}/dashboard`)}
                    />
                    <button
                        onClick={() => navigate(`/${academySlug}/dashboard`)}
                        className="btn btn-primary mt-4"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--spacing-3xl)' }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'var(--bg-card)',
                borderBottom: '1px solid var(--neutral-200)',
                padding: 'var(--spacing-xl) 0',
                marginBottom: 'var(--spacing-xl)'
            }}>
                <div className="container">
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
                        <span>{exam?.title || 'Exam'}</span>
                        {' / '}
                        <span>Results</span>
                    </div>

                    {/* Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: 'var(--primary-purple)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.5rem'
                        }}>
                            📊
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                {exam?.title}
                            </h1>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                Exam Results & Monitoring
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Summary Cards */}
                {summary && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-xl)'
                    }}>
                        {/* Total Attempts */}
                        <div className="card card--sm">
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                Total Attempts
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-purple)' }}>
                                {summary.totalAttempts || 0}
                            </div>
                        </div>

                        {/* Submitted */}
                        <div className="card card--sm">
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                Submitted
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
                                {summary.submittedCount || 0}
                            </div>
                        </div>

                        {/* Average Score */}
                        <div className="card card--sm">
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                Average Score
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {summary.averageScore ? `${summary.averageScore.toFixed(1)}%` : 'N/A'}
                            </div>
                        </div>

                        {/* Highest Score */}
                        <div className="card card--sm">
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                Highest Score
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#22c55e' }}>
                                {summary.highestScore !== null && summary.highestScore !== undefined
                                    ? `${summary.highestScore}/${summary.totalQuestions || 0}`
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Attempts Table */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
                        Student Attempts ({attempts.length})
                    </h2>

                    {attempts.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--spacing-3xl)',
                            color: 'var(--text-secondary)'
                        }}>
                            <p style={{ fontSize: '1.125rem', marginBottom: 'var(--spacing-sm)' }}>
                                📝 No attempts yet
                            </p>
                            <p style={{ fontSize: '0.875rem' }}>
                                Students haven't started this exam yet.
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.95rem'
                            }}>
                                <thead>
                                    <tr style={{
                                        borderBottom: '2px solid var(--neutral-200)',
                                        backgroundColor: 'var(--neutral-50)'
                                    }}>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)'
                                        }}>
                                            Student
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)'
                                        }}>
                                            Status
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)'
                                        }}>
                                            Score
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)'
                                        }}>
                                            Submitted At
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)'
                                        }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map((attempt, index) => {
                                        const status = getStatusBadge(attempt);
                                        return (
                                            <tr
                                                key={attempt.studentId || index}
                                                style={{
                                                    borderBottom: '1px solid var(--neutral-200)',
                                                    transition: 'background-color var(--transition-fast)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-50)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                                        {attempt.username || 'Unknown'}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                        ID: {attempt.studentId?.slice(0, 8)}...
                                                    </div>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: status.bgColor,
                                                        color: status.color,
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                                    {attempt.score !== null && attempt.score !== undefined ? (
                                                        <span style={{
                                                            fontSize: '1.125rem',
                                                            fontWeight: '600',
                                                            color: 'var(--primary-purple)'
                                                        }}>
                                                            {attempt.score} / {summary?.totalQuestions || '?'}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    {attempt.submittedAt ? (
                                                        <span style={{ color: 'var(--text-primary)' }}>
                                                            {new Date(attempt.submittedAt).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)' }}>Not submitted</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                                    {attempt.submittedAt ? (
                                                        <button
                                                            onClick={() => navigate(`/${academySlug}/dashboard/exams/${examId}/student/${attempt.studentId}`)}
                                                            className="btn btn-outline btn-sm"
                                                        >
                                                            View Details
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                            In progress...
                                                        </span>
                                                    )}
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
        </div>
    );
};

export default TeacherExamMonitoring;
