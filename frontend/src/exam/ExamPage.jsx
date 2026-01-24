import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { studentAPI, examAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { showSuccess, showError } from '../utils/notifications';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';

const ExamPage = () => {
    const { academySlug, examId } = useParams();
    const navigate = useNavigate();
    const { student, isAuthenticated } = useStudentAuth();

    // Phase Control (NEW)
    const [examPhase, setExamPhase] = useState('loading'); // loading | before | during | after

    // Guards & Flags
    const startAttemptedRef = useRef(false);

    // Exam State
    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});

    // UI State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Timer State
    const [timeRemaining, setTimeRemaining] = useState(0);
    const timerIntervalRef = useRef(null);

    // 0️⃣ RULE 1: Check authentication on mount
    useEffect(() => {
        if (!isAuthenticated) {
            navigate(`/${academySlug}/login`);
        }
    }, [isAuthenticated, academySlug, navigate]);

    // 1️⃣ Get Exam Info (NOT /start) - Determine Phase
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchExamInfo = async () => {
            try {
                setExamPhase('loading');
                setError('');

                // Get exam info WITHOUT starting
                const info = await examAPI.getStatus(examId);

                setExam(info);

                // Determine phase based on backend response
                const now = new Date();
                const startTime = new Date(info.startTime);
                const endTime = new Date(info.endTime);

                if (info.attemptStatus === 'submitted') {
                    // Already submitted
                    setExamPhase('after');
                } else if (info.attemptStatus === 'in_progress') {
                    // Already started, resume exam
                    setExamPhase('during');
                    // Load existing attempt automatically
                    await resumeExam(info);
                } else if (now < startTime) {
                    // Exam hasn't started yet
                    setExamPhase('before');
                } else if (now > endTime) {
                    // Exam has ended
                    setExamPhase('after');
                } else {
                    // Ready to start
                    setExamPhase('before');
                }

            } catch (err) {
                console.error('Error fetching exam info:', err);

                if (err.status === 401) {
                    navigate(`/${academySlug}/login`);
                } else {
                    setError(err.message || 'Failed to load exam information.');
                    setExamPhase('before');
                }
            }
        };

        fetchExamInfo();
    }, [isAuthenticated, examId, academySlug, navigate]);

    // 2️⃣ Resume Exam (if already in progress)
    const resumeExam = async (examInfo) => {
        if (startAttemptedRef.current) return;

        try {
            startAttemptedRef.current = true;

            // Fetch questions (this also returns attemptId and startedAt)
            const questionsData = await examAPI.getQuestions(examId);
            setQuestions(questionsData.questions || []);

            // Set attempt info from questions response
            setAttempt({
                attemptId: questionsData.attemptId,
                startedAt: questionsData.startedAt,
                durationMinutes: questionsData.durationMinutes,
                serverStartTime: questionsData.startedAt
            });

            // Initialize answers from backend
            const initialAnswers = {};
            if (questionsData.questions) {
                questionsData.questions.forEach(q => {
                    if (q.selectedOption && q.selectedOption > 0) {
                        initialAnswers[q.id] = q.selectedOption;
                    }
                });
            }
            setAnswers(initialAnswers);

            // Start timer
            if (questionsData.durationMinutes && questionsData.startedAt) {
                startTimer(questionsData.startedAt, questionsData.durationMinutes);
            }

        } catch (err) {
            console.error('Error resuming exam:', err);
            setError(err.message || 'Failed to resume exam.');
            startAttemptedRef.current = false;
        }
    };

    // 3️⃣ Start Exam (User clicks "Start Exam" button)
    const handleStartExam = async () => {
        if (startAttemptedRef.current) return;

        try {
            startAttemptedRef.current = true;
            setError('');

            // Call POST /start
            const startData = await examAPI.start(examId);
            setAttempt(startData);

            // Fetch locked questions
            const questionsData = await examAPI.getQuestions(examId);
            setQuestions(questionsData.questions || []);

            // Initialize empty answers
            setAnswers({});

            // Start timer
            if (startData.durationMinutes && startData.serverStartTime) {
                startTimer(startData.serverStartTime, startData.durationMinutes);
            }

            // Change phase to DURING
            setExamPhase('during');

        } catch (err) {
            console.error('Error starting exam:', err);

            if (err.status === 400) {
                // Already attempted
                setError('You have already attempted this exam.');
                setExamPhase('after');
            } else if (err.status === 401) {
                navigate(`/${academySlug}/login`);
            } else {
                setError(err.message || 'Failed to start exam.');
            }

            startAttemptedRef.current = false;
        }
    };

    // 4️⃣ Timer Management
    const startTimer = (serverStartTime, durationMinutes) => {
        const calculateTimeRemaining = () => {
            const startTime = new Date(serverStartTime).getTime();
            const endTime = startTime + (durationMinutes * 60 * 1000);
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
            return remaining;
        };

        setTimeRemaining(calculateTimeRemaining());

        timerIntervalRef.current = setInterval(() => {
            const remaining = calculateTimeRemaining();
            setTimeRemaining(remaining);

            if (remaining <= 0) {
                clearInterval(timerIntervalRef.current);
                handleAutoSubmit();
            }
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    // 5️⃣ Answer Saving - Single Answer Autosave
    const handleAnswerChange = async (questionId, selectedOption) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: selectedOption
        }));

        try {
            await examAPI.saveAnswer(examId, { questionId, selectedOption });
        } catch (err) {
            console.error('Error saving answer:', err);
        }
    };

    // 5️⃣ Batch Save (Safety Net)
    const batchSaveAnswers = async () => {
        try {
            const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
                questionId,
                selectedOption
            }));

            if (answersArray.length > 0) {
                await examAPI.saveAllAnswers(examId, { answers: answersArray });
            }
        } catch (err) {
            console.error('Error batch saving answers:', err);
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            batchSaveAnswers();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [answers]);

    // 6️⃣ Question Navigation
    const goToQuestion = (index) => {
        if (submitting) return;
        setCurrentQuestionIndex(index);
    };

    const goToPrevious = () => {
        if (currentQuestionIndex > 0 && !submitting) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const goToNext = () => {
        if (currentQuestionIndex < questions.length - 1 && !submitting) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    // 7️⃣ Auto Submit
    const handleAutoSubmit = async () => {
        if (submitting) return;

        setSubmitting(true);

        try {
            await batchSaveAnswers();
            await examAPI.submit(examId);

            // DON'T redirect - change phase to AFTER
            setExamPhase('after');

            // Reload exam info to get score
            const info = await examAPI.getStatus(examId);
            setExam(info);

        } catch (err) {
            console.error('Error auto-submitting exam:', err);
            setError('Failed to submit exam. Please try again.');
            setSubmitting(false);
        }
    };

    // 8️⃣ Manual Submit
    const handleManualSubmit = async () => {
        if (submitting) return;

        const confirmed = window.confirm(
            'Are you sure you want to submit your exam? You cannot change your answers after submission.'
        );

        if (!confirmed) return;

        setSubmitting(true);

        try {
            await batchSaveAnswers();
            await examAPI.submit(examId);

            // DON'T redirect - change phase to AFTER
            setExamPhase('after');

            // Reload exam info to get score
            const info = await examAPI.getStatus(examId);
            setExam(info);

        } catch (err) {
            console.error('Error submitting exam:', err);

            if (err.status === 400) {
                setExamPhase('after');
                const info = await examAPI.getStatus(examId);
                setExam(info);
            } else {
                setError(err.message || 'Failed to submit exam. Please try again.');
                setSubmitting(false);
            }
        }
    };

    // Helper: Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimeColor = () => {
        if (timeRemaining <= 60) return '#ef4444';
        if (timeRemaining <= 300) return '#f97316';
        return 'var(--text-primary)';
    };

    // ============================================
    // PHASE 1: LOADING
    // ============================================
    if (examPhase === 'loading') {
        return (
            <div className="page-container">
                <div className="container container--sm">
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
                        <p style={{ color: 'var(--text-secondary)' }}>Loading exam...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // PHASE 2: BEFORE EXAM (Exam Info + Start Button)
    // ============================================
    if (examPhase === 'before') {
        const now = new Date();
        const startTime = exam?.startTime ? new Date(exam.startTime) : null;
        const endTime = exam?.endTime ? new Date(exam.endTime) : null;
        const canStart = startTime && now >= startTime && endTime && now <= endTime;

        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--spacing-3xl)' }}>
                {/* Exam Header */}
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
                                onClick={() => navigate(`/${academySlug}`)}
                                style={{ color: 'var(--primary-purple)', cursor: 'pointer' }}
                            >
                                {academySlug}
                            </span>
                            {' / '}
                            <span>{exam?.title || 'Exam'}</span>
                        </div>

                        {/* Exam Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
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
                                📝
                            </div>
                            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                {exam?.title || 'Exam'}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="container container--md">
                    <div className="card">
                        {/* Exam Info */}
                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <div style={{
                                display: 'grid',
                                gap: 'var(--spacing-md)',
                                fontSize: '0.95rem'
                            }}>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>Opened:</strong>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {exam?.startTime ? new Date(exam.startTime).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>Closes:</strong>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {exam?.endTime ? new Date(exam.endTime).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>Attempts allowed:</strong>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>1</span>
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>Time limit:</strong>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {exam?.durationMinutes || 0} mins
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: '#fee',
                                border: '1px solid #fcc',
                                borderRadius: 'var(--radius-md)',
                                color: '#c33',
                                marginBottom: 'var(--spacing-md)',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Start Button */}
                        <div style={{
                            paddingTop: 'var(--spacing-lg)',
                            borderTop: '1px solid var(--neutral-200)',
                            textAlign: 'center'
                        }}>
                            <button
                                onClick={handleStartExam}
                                disabled={!canStart || startAttemptedRef.current}
                                className="btn btn-primary btn-lg"
                                style={{
                                    minWidth: '200px'
                                }}
                            >
                                {!canStart
                                    ? (now < startTime ? 'Exam Not Started' : 'Exam Ended')
                                    : (startAttemptedRef.current ? 'Starting...' : 'Start Exam')
                                }
                            </button>

                            {canStart && (
                                <p style={{
                                    marginTop: 'var(--spacing-md)',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    Once you start, the timer will begin and you cannot pause.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // PHASE 3: AFTER EXAM (Summary / Result)
    // ============================================
    if (examPhase === 'after') {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--spacing-3xl)' }}>
                {/* Exam Header */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--neutral-200)',
                    padding: 'var(--spacing-xl) 0',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    <div className="container">
                        <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--spacing-md)'
                        }}>
                            <span
                                onClick={() => navigate(`/${academySlug}`)}
                                style={{ color: 'var(--primary-purple)', cursor: 'pointer' }}
                            >
                                {academySlug}
                            </span>
                            {' / '}
                            <span>{exam?.title || 'Exam'}</span>
                        </div>

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
                                ✓
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                    {exam?.title || 'Exam'}
                                </h1>
                                <span style={{
                                    display: 'inline-block',
                                    marginTop: 'var(--spacing-xs)',
                                    padding: '0.25rem 0.75rem',
                                    backgroundColor: 'var(--success)',
                                    color: 'white',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}>
                                    ✓ Done
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container container--md">
                    <div className="card">
                        {/* Exam Info */}
                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                                Exam Information
                            </h2>
                            <div style={{
                                display: 'grid',
                                gap: 'var(--spacing-md)',
                                fontSize: '0.95rem'
                            }}>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>Opened:</strong>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {exam?.startTime ? new Date(exam.startTime).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>Closed:</strong>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {exam?.endTime ? new Date(exam.endTime).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>Time limit:</strong>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {exam?.durationMinutes || 0} mins
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div style={{
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-xl)'
                        }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                                Summary of your attempt
                            </h2>
                            <div style={{
                                display: 'grid',
                                gap: 'var(--spacing-md)',
                                fontSize: '0.95rem'
                            }}>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>State:</strong>{' '}
                                    <span style={{ color: 'var(--success)', fontWeight: '600' }}>Finished</span>
                                </div>
                                <div>
                                    <strong style={{ color: 'var(--text-primary)' }}>Submitted:</strong>{' '}
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {exam?.submittedAt ? new Date(exam.submittedAt).toLocaleString() : 'Just now'}
                                    </span>
                                </div>
                                {exam?.score !== undefined && (
                                    <div>
                                        <strong style={{ color: 'var(--text-primary)' }}>Score:</strong>{' '}
                                        <span style={{ color: 'var(--primary-purple)', fontWeight: '600', fontSize: '1.125rem' }}>
                                            {exam.score} / {exam.totalQuestions || questions.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* No more attempts message */}
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #3b82f6',
                            borderRadius: 'var(--radius-md)',
                            color: '#1e40af',
                            marginBottom: 'var(--spacing-lg)',
                            fontSize: '0.875rem'
                        }}>
                            ℹ️ No more attempts are allowed
                        </div>

                        {/* Back Button */}
                        <div style={{ textAlign: 'center' }}>
                            <button
                                onClick={() => navigate(`/${academySlug}`)}
                                className="btn btn-primary"
                            >
                                Back to Academy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================
    // PHASE 4: DURING EXAM (Your Existing UI)
    // ============================================
    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--spacing-3xl)' }}>
            {/* Theme Toggle */}
            <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000 }}>
                <ThemeToggle />
            </div>
            
            {/* Exam Header */}
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
                            onClick={() => navigate(`/${academySlug}`)}
                            style={{ color: 'var(--primary-purple)', cursor: 'pointer' }}
                        >
                            {academySlug}
                        </span>
                        {' / '}
                        <span>{exam?.title || 'Exam'}</span>
                    </div>

                    {/* Exam Title */}
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
                            📝
                        </div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                            {exam?.title || 'Exam'}
                        </h1>
                    </div>

                    {/* Exam Info */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-md)',
                        fontSize: '0.875rem'
                    }}>
                        <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Opened:</strong>{' '}
                            <span style={{ color: 'var(--text-secondary)' }}>
                                {exam?.startTime ? new Date(exam.startTime).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                        <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Closes:</strong>{' '}
                            <span style={{ color: 'var(--text-secondary)' }}>
                                {exam?.endTime ? new Date(exam.endTime).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                        <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Time limit:</strong>{' '}
                            <span style={{ color: 'var(--text-secondary)' }}>
                                {exam?.durationMinutes || 0} mins
                            </span>
                        </div>
                        <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Questions:</strong>{' '}
                            <span style={{ color: 'var(--text-secondary)' }}>
                                {questions.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container container--lg">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-xl)' }}>
                    {/* Main Content - Questions */}
                    <div>
                        {/* Timer Warning */}
                        <div className="card" style={{
                            backgroundColor: timeRemaining <= 300 ? '#fef3c7' : 'var(--bg-card)',
                            border: `1px solid ${timeRemaining <= 300 ? '#fbbf24' : 'var(--neutral-200)'}`,
                            marginBottom: 'var(--spacing-md)',
                            padding: 'var(--spacing-md)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <span style={{ fontSize: '1.25rem' }}>⏱️</span>
                                    <span style={{ fontWeight: '600', color: getTimeColor(), fontSize: '1.125rem' }}>
                                        Time Remaining: {formatTime(timeRemaining)}
                                    </span>
                                </div>
                                {timeRemaining <= 300 && (
                                    <span style={{ color: '#d97706', fontSize: '0.875rem', fontWeight: '500' }}>
                                        ⚠️ Hurry up!
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Question Card */}
                        {currentQuestion && (
                            <div className="card">
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 'var(--spacing-lg)',
                                    paddingBottom: 'var(--spacing-md)',
                                    borderBottom: '1px solid var(--neutral-200)'
                                }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                                        Question {currentQuestionIndex + 1}
                                    </h2>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        backgroundColor: answers[currentQuestion.id] ? 'var(--success)' : 'var(--neutral-200)',
                                        color: answers[currentQuestion.id] ? 'white' : 'var(--text-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}>
                                        {answers[currentQuestion.id] ? '✓ Answered' : 'Not Answered'}
                                    </span>
                                </div>

                                {/* Question Text */}
                                <div style={{
                                    fontSize: '1.125rem',
                                    lineHeight: '1.7',
                                    color: 'var(--text-primary)',
                                    marginBottom: 'var(--spacing-xl)'
                                }}>
                                    {currentQuestion.question}
                                </div>

                                {/* Options */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                    {currentQuestion.options && Array.isArray(currentQuestion.options) && currentQuestion.options.map((optionText, index) => {
                                        if (!optionText) return null;

                                        const isSelected = answers[currentQuestion.id] === index;

                                        return (
                                            <label
                                                key={index}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: 'var(--spacing-md)',
                                                    border: `2px solid ${isSelected ? 'var(--primary-purple)' : 'var(--neutral-200)'}`,
                                                    borderRadius: 'var(--radius-md)',
                                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'white',
                                                    transition: 'all var(--transition-base)',
                                                    opacity: submitting ? 0.6 : 1
                                                }}
                                                onClick={() => !submitting && handleAnswerChange(currentQuestion.id, index)}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestion.id}`}
                                                    checked={isSelected}
                                                    onChange={() => handleAnswerChange(currentQuestion.id, index)}
                                                    disabled={submitting}
                                                    style={{ marginRight: 'var(--spacing-md)', cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                                                    {optionText}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* Navigation Buttons */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: 'var(--spacing-xl)',
                                    paddingTop: 'var(--spacing-xl)',
                                    borderTop: '1px solid var(--neutral-200)'
                                }}>
                                    <button
                                        onClick={goToPrevious}
                                        disabled={currentQuestionIndex === 0 || submitting}
                                        className="btn btn-outline"
                                    >
                                        ← Previous
                                    </button>

                                    <button
                                        onClick={goToNext}
                                        disabled={currentQuestionIndex === questions.length - 1 || submitting}
                                        className="btn btn-outline"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Navigation & Submit */}
                    <div>
                        {/* Progress Card */}
                        <div className="card card--sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                                Progress
                            </h3>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: 'var(--primary-purple)',
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                {answeredCount} / {questions.length}
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Questions Answered
                            </p>

                            {/* Progress Bar */}
                            <div style={{
                                marginTop: 'var(--spacing-md)',
                                height: '8px',
                                backgroundColor: 'var(--neutral-200)',
                                borderRadius: '999px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(answeredCount / questions.length) * 100}%`,
                                    backgroundColor: 'var(--primary-purple)',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>

                        {/* Question Navigator */}
                        <div className="card card--sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                                Question Navigator
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: 'var(--spacing-xs)'
                            }}>
                                {questions.map((q, index) => (
                                    <button
                                        key={q.id}
                                        onClick={() => goToQuestion(index)}
                                        disabled={submitting}
                                        style={{
                                            padding: '0.5rem',
                                            border: `2px solid ${index === currentQuestionIndex ? 'var(--primary-purple)' : 'var(--neutral-200)'}`,
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: answers[q.id] ? 'var(--success)' : (index === currentQuestionIndex ? 'rgba(99, 102, 241, 0.1)' : 'white'),
                                            color: answers[q.id] ? 'white' : 'var(--text-primary)',
                                            fontWeight: '600',
                                            fontSize: '0.875rem',
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            transition: 'all var(--transition-fast)'
                                        }}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleManualSubmit}
                            disabled={submitting}
                            className="btn btn-primary btn-full btn-lg"
                            style={{
                                backgroundColor: submitting ? 'var(--neutral-400)' : 'var(--error)',
                                fontSize: '1rem',
                                fontWeight: '700'
                            }}
                        >
                            {submitting ? 'Submitting...' : '🚀 Submit Exam'}
                        </button>

                        {error && (
                            <div style={{
                                marginTop: 'var(--spacing-md)',
                                padding: 'var(--spacing-sm)',
                                backgroundColor: '#fee',
                                border: '1px solid #fcc',
                                borderRadius: 'var(--radius-md)',
                                color: '#c33',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamPage;
