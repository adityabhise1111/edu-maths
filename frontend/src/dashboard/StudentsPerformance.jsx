import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teacherAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import DashboardLayout from './DashboardLayout/DashboardLayout';
import { PerformanceSkeleton } from './StudentsPerformance/PerformanceSkeleton';

const StudentsPerformance = () => {
    const { academySlug } = useParams();
    const navigate = useNavigate();
    const { isLoaded, isSignedIn, academy } = useAuth();

    const [studentsData, setStudentsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'averageScore', direction: 'desc' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch students performance data
    useEffect(() => {
        if (!isLoaded) return; // Wait for auth to load
        if (!isSignedIn) {
            navigate('/login');
            return;
        }
        if (!academy?.id) {
            setLoading(false);
            setError('Academy not found. Please select an academy.');
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await teacherAPI.getAcademyStudentsPerformance(academy.id, { page: 1, limit: 10 });
                setStudentsData(response.students || []);

                // Set pagination metadata
                if (response.pagination) {
                    setCurrentPage(response.pagination.currentPage);
                    setTotalPages(response.pagination.totalPages);
                }
            } catch (err) {
                console.error('Error fetching students performance:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load performance data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isLoaded, isSignedIn, academy, navigate]);

    // Load more students
    const loadMoreStudents = async () => {
        if (currentPage >= totalPages || !academy?.id) return;

        try {
            setLoadingMore(true);
            const nextPage = currentPage + 1;
            const response = await teacherAPI.getAcademyStudentsPerformance(academy.id, { page: nextPage, limit: 10 });

            setStudentsData(prev => [...prev, ...(response.students || [])]);

            if (response.pagination) {
                setCurrentPage(response.pagination.currentPage);
                setTotalPages(response.pagination.totalPages);
            }
        } catch (err) {
            console.error('Error loading more students:', err);
            setError('Failed to load more students');
        } finally {
            setLoadingMore(false);
        }
    };

    // Sort students
    const sortedStudents = [...studentsData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        const compareResult = aValue < bValue ? -1 : 1;
        return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    });

    // Handle column sort
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get performance badge color
    const getPerformanceBadge = (avgScore) => {
        if (avgScore >= 80) return { color: 'var(--success)', bg: 'var(--success-light)', label: 'Excellent' };
        if (avgScore >= 60) return { color: 'var(--warning-dark)', bg: 'var(--warning-light)', label: 'Good' };
        if (avgScore >= 40) return { color: 'var(--warning-dark)', bg: 'var(--warning-light)', label: 'Average' };
        return { color: 'var(--error)', bg: 'var(--error-light)', label: 'Needs Improvement' };
    };

    // Calculate academy stats
    const academyStats = {
        totalStudents: studentsData.length,
        activeStudents: studentsData.filter(s => s.totalExamsAttempted > 0).length,
        avgClassScore: studentsData.length > 0
            ? (studentsData.reduce((sum, s) => sum + s.averageScore, 0) / studentsData.length).toFixed(2)
            : 0,
        totalExams: studentsData.reduce((sum, s) => sum + s.totalExamsSubmitted, 0)
    };

    if (loading) {
        return (
            <DashboardLayout>
                <PerformanceSkeleton />
            </DashboardLayout>
        );
    }

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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                        <div>
                            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                📊 Students Performance
                            </h1>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)', marginBottom: 0 }}>
                                Overall performance metrics for {academy?.name || 'your academy'}
                            </p>
                        </div>
                    </div>

                    {/* Academy Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                                Total Students
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-purple)' }}>
                                {academyStats.totalStudents}
                            </div>
                        </div>

                        <div style={{
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--neutral-200)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
                                Active Students
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
                                {academyStats.activeStudents}
                            </div>
                        </div>

                        <div style={{
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--neutral-200)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
                                Class Average
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-purple)' }}>
                                {academyStats.avgClassScore}%
                            </div>
                        </div>

                        <div style={{
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--neutral-200)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-xs)' }}>
                                Total Submissions
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-purple)' }}>
                                {academyStats.totalExams}
                            </div>
                        </div>
                    </div>
                </div>

                {error && <ErrorAlert message={error} />}

                {/* Students Performance Table */}
                {studentsData.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--spacing-3xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📊</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                            No Performance Data Yet
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                            Performance data will appear once students start taking exams.
                        </p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                                            textTransform: 'uppercase',
                                            cursor: 'pointer'
                                        }}>
                                            #
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer'
                                        }}
                                            onClick={() => handleSort('username')}
                                        >
                                            Student {sortConfig.key === 'username' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer'
                                        }}
                                            onClick={() => handleSort('totalExamsAttempted')}
                                        >
                                            Attempts {sortConfig.key === 'totalExamsAttempted' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer'
                                        }}
                                            onClick={() => handleSort('totalExamsSubmitted')}
                                        >
                                            Submitted {sortConfig.key === 'totalExamsSubmitted' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer'
                                        }}
                                            onClick={() => handleSort('averageScore')}
                                        >
                                            Avg Score {sortConfig.key === 'averageScore' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase'
                                        }}>
                                            Performance
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer'
                                        }}
                                            onClick={() => handleSort('joinedAt')}
                                        >
                                            Joined {sortConfig.key === 'joinedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStudents.map((student, index) => {
                                        const badge = getPerformanceBadge(student.averageScore);
                                        return (
                                            <tr
                                                key={student.studentId}
                                                style={{
                                                    borderBottom: '1px solid var(--neutral-200)',
                                                    transition: 'background-color 0.2s',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    fontSize: '0.875rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {index + 1}
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    fontWeight: '600',
                                                    color: 'var(--text-primary)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            backgroundColor: 'var(--primary-purple)',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.875rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            {student.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        {student.username}
                                                    </div>
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    fontSize: '0.875rem',
                                                    color: 'var(--text-secondary)',
                                                    textAlign: 'center'
                                                }}>
                                                    {student.totalExamsAttempted}
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    fontSize: '0.875rem',
                                                    color: 'var(--text-secondary)',
                                                    textAlign: 'center'
                                                }}>
                                                    {student.totalExamsSubmitted}
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    fontSize: '1rem',
                                                    fontWeight: '700',
                                                    color: 'var(--primary-purple)',
                                                    textAlign: 'center'
                                                }}>
                                                    {student.averageScore > 0 ? `${student.averageScore}%` : '-'}
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    textAlign: 'center'
                                                }}>
                                                    {student.averageScore > 0 ? (
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: 'var(--radius-full)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            color: badge.color,
                                                            backgroundColor: badge.bg
                                                        }}>
                                                            {badge.label}
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: 'var(--radius-full)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            color: 'var(--text-secondary)',
                                                            backgroundColor: 'var(--neutral-100)'
                                                        }}>
                                                            No Data
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{
                                                    padding: 'var(--spacing-md)',
                                                    fontSize: '0.875rem',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {formatDate(student.joinedAt)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Load More Button */}
                        {studentsData.length > 0 && currentPage < totalPages && (
                            <div style={{
                                padding: 'var(--spacing-xl)',
                                textAlign: 'center',
                                borderTop: '1px solid var(--neutral-200)'
                            }}>
                                <button
                                    onClick={loadMoreStudents}
                                    disabled={loadingMore}
                                    style={{
                                        background: loadingMore ? 'var(--neutral-200)' : 'var(--primary-purple)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 2rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        cursor: loadingMore ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        minWidth: '200px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!loadingMore) {
                                            e.target.style.background = 'var(--primary-purple-dark)';
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = loadingMore ? 'var(--neutral-200)' : 'var(--primary-purple)';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    {loadingMore ? 'Loading...' : `Load More (Page ${currentPage + 1} of ${totalPages})`}
                                </button>
                            </div>
                        )}

                        {/* Pagination Info */}
                        {studentsData.length > 0 && (
                            <div style={{
                                padding: 'var(--spacing-md)',
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                                borderTop: currentPage < totalPages ? 'none' : '1px solid var(--neutral-200)'
                            }}>
                                Showing {studentsData.length} students (Page {currentPage} of {totalPages})
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentsPerformance;
