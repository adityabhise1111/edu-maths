import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentExamDetails = () => {
    const { academySlug, examId, studentId } = useParams();
    const navigate = useNavigate();
    const { isLoaded, isSignedIn } = useAuth();

    // State
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/login');
        }
    }, [isLoaded, isSignedIn, navigate]);

    // Fetch student exam details
    useEffect(() => {
        if (!isSignedIn) return;

        const fetchDetails = async () => {
            try {
                setLoading(true);
                setError('');

                const result = await teacherAPI.getStudentExamDetails(examId, studentId);
                setData(result);

            } catch (err) {
                console.error('Error fetching student exam details:', err);
                setError(err.message || 'Failed to load exam details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [examId, studentId, isSignedIn]);

    // Loading State
    if (loading) {
        return (
            <div className="page-container">
                <div className="container">
                    <div className="card text-center">
                        <div style={{
                            display: 'inline-block',
                            width: '48px',
                            height: '48px',
                            border: '4px solid var(--neutral-200)',
                            borderTopColor: 'var(--primary-purple)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto var(--spacing-md)'
                        }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Loading exam details...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="page-container">
                <div className="container">
                    <div className="card" style={{
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        color: '#c33'
                    }}>
                        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>⚠️ Error</h2>
                        <p>{error}</p>
                        <button
                            onClick={() => navigate(`/${academySlug}/dashboard/exams/${examId}`)}
                            className="btn btn-primary mt-4"
                        >
                            Back to Results
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { student, exam, attempt, questions } = data;
    const correctCount = questions.filter(q => q.isCorrect).length;
    const incorrectCount = questions.length - correctCount;
    const percentage = exam.totalQuestions > 0
        ? Math.round((attempt.score / exam.totalQuestions) * 100)
        : 0;

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
                        <span
                            onClick={() => navigate(`/${academySlug}/dashboard/exams/${examId}`)}
                            style={{ color: 'var(--primary-purple)', cursor: 'pointer' }}
                        >
                            {exam.title}
                        </span>
                        {' / '}
                        <span>{student.username}</span>
                    </div>

                    {/* Title */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: 'var(--success)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '1.5rem'
                            }}>
                                👤
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                    {student.username}'s Results
                                </h1>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                    {exam.title} - Detailed Breakdown
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/${academySlug}/dashboard/exams/${examId}`)}
                            className="btn btn-outline"
                        >
                            ← Back to Results
                        </button>
                    </div>
                </div>
            </div>

            <div className="container container--lg">
                {/* Summary Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    {/* Score */}
                    <div className="card card--sm">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Final Score
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary-purple)' }}>
                            {attempt.score} / {exam.totalQuestions}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            {percentage}%
                        </div>
                    </div>

                    {/* Correct */}
                    <div className="card card--sm">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Correct Answers
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>
                            {correctCount}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            {Math.round((correctCount / questions.length) * 100)}%
                        </div>
                    </div>

                    {/* Incorrect */}
                    <div className="card card--sm">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Incorrect Answers
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--error)' }}>
                            {incorrectCount}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            {Math.round((incorrectCount / questions.length) * 100)}%
                        </div>
                    </div>

                    {/* Submitted At */}
                    <div className="card card--sm">
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                            Submitted
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: 'var(--spacing-sm)' }}>
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleTimeString() : ''}
                        </div>
                    </div>
                </div>

                {/* Questions Breakdown */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-xl)' }}>
                        Question-by-Question Breakdown
                    </h2>

                    {questions.map((q, index) => (
                        <div
                            key={q.questionId}
                            style={{
                                padding: 'var(--spacing-lg)',
                                marginBottom: 'var(--spacing-md)',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: `2px solid ${q.isCorrect ? 'var(--success)' : 'var(--error)'}`
                            }}
                        >
                            {/* Question Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'var(--spacing-md)',
                                paddingBottom: 'var(--spacing-md)',
                                borderBottom: '1px solid var(--neutral-200)'
                            }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                                    Question {index + 1}
                                </h3>
                                <span style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: q.isCorrect ? 'var(--success)' : 'var(--error)',
                                    color: 'white',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                </span>
                            </div>

                            {/* Question Text */}
                            <div style={{
                                fontSize: '1.125rem',
                                lineHeight: '1.7',
                                color: 'var(--text-primary)',
                                marginBottom: 'var(--spacing-lg)',
                                fontWeight: '500'
                            }}>
                                {q.question}
                            </div>

                            {/* Options */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                {q.options.map((option, optIndex) => {
                                    const isSelected = q.selectedOption === optIndex;
                                    const isCorrect = q.correctAnswer === optIndex;

                                    let borderColor = 'var(--neutral-200)';
                                    let backgroundColor = 'var(--bg-card)';
                                    let icon = null;

                                    if (isSelected && isCorrect) {
                                        // Student selected correct answer
                                        borderColor = 'var(--success)';
                                        backgroundColor = '#f0fdf4';
                                        icon = '✓';
                                    } else if (isSelected && !isCorrect) {
                                        // Student selected wrong answer
                                        borderColor = 'var(--error)';
                                        backgroundColor = '#fef2f2';
                                        icon = '✗';
                                    } else if (!isSelected && isCorrect) {
                                        // Correct answer (not selected)
                                        borderColor = 'var(--success)';
                                        backgroundColor = '#f0fdf4';
                                        icon = '✓';
                                    }

                                    return (
                                        <div
                                            key={optIndex}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 'var(--spacing-md)',
                                                border: `2px solid ${borderColor}`,
                                                borderRadius: 'var(--radius-md)',
                                                backgroundColor,
                                                fontWeight: (isSelected || isCorrect) ? '600' : '400'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    backgroundColor: isSelected ? borderColor : 'var(--neutral-200)',
                                                    color: isSelected ? 'white' : 'var(--text-secondary)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {String.fromCharCode(65 + optIndex)}
                                                </span>
                                                <span style={{ color: 'var(--text-primary)' }}>
                                                    {option}
                                                </span>
                                            </div>

                                            {icon && (
                                                <span style={{
                                                    fontSize: '1.25rem',
                                                    fontWeight: '700',
                                                    color: isSelected ? (isCorrect ? 'var(--success)' : 'var(--error)') : 'var(--success)'
                                                }}>
                                                    {icon}
                                                </span>
                                            )}

                                            {isSelected && !isCorrect && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--error)',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    Student's Answer
                                                </span>
                                            )}

                                            {!isSelected && isCorrect && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--success)',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    Correct Answer
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentExamDetails;
