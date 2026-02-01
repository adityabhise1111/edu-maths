import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teacherAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { Users, GraduationCap, Trash2, UserRoundPlus, AlertTriangle, Search, Eye } from 'lucide-react';

const StudentsList = () => {
    const { academySlug } = useParams();
    const navigate = useNavigate();
    const { isLoaded, isSignedIn, academy } = useAuth();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState({ show: false, student: null });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    // Ref to track in-progress request (synchronous check to prevent race conditions)
    const isLoadingRef = useRef(false);
    // Ref to store AbortController for request cancellation
    const abortControllerRef = useRef(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/login');
        }
    }, [isLoaded, isSignedIn, navigate]);

    // Fetch students
    useEffect(() => {
        if (!isSignedIn) return;

        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await teacherAPI.getAcademyStudents({ page: 1, limit: 10 });
                setStudents(response.students || []);

                // Set pagination metadata
                if (response.pagination) {
                    setCurrentPage(response.pagination.currentPage);
                    setTotalPages(response.pagination.totalPages);
                }
            } catch (err) {
                console.error('Error fetching students:', err);
                setError(err.message || 'Failed to load students');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [isSignedIn]);

    // Load more students with protection against rapid clicks
    const loadMoreStudents = useCallback(async () => {
        // Synchronous check using ref to prevent race conditions from rapid clicks
        if (isLoadingRef.current || currentPage >= totalPages) return;
        
        // Set ref immediately (synchronous) to block subsequent calls
        isLoadingRef.current = true;
        
        // Cancel any previous pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        try {
            setLoadingMore(true);
            const nextPage = currentPage + 1;
            const response = await teacherAPI.getAcademyStudents(
                { page: nextPage, limit: 10 },
                abortControllerRef.current.signal
            );

            setStudents(prev => [...prev, ...(response.students || [])]);

            if (response.pagination) {
                setCurrentPage(response.pagination.currentPage);
                setTotalPages(response.pagination.totalPages);
            }
        } catch (err) {
            // Ignore abort errors
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return;
            }
            console.error('Error loading more students:', err);
            setError('Failed to load more students');
        } finally {
            isLoadingRef.current = false;
            setLoadingMore(false);
        }
    }, [currentPage, totalPages]);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle add student form submission
    const handleAddStudent = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.username.trim()) {
            setFormError('Username is required');
            return;
        }
        if (formData.password.length < 6) {
            setFormError('Password must be at least 6 characters');
            return;
        }
        if (!academy?.id) {
            setFormError('Academy information not found');
            return;
        }

        try {
            setFormLoading(true);
            setFormError('');

            await teacherAPI.createStudent(academy.id, formData.username, formData.password);

            // Success - refresh students list (reset to page 1)
            const response = await teacherAPI.getAcademyStudents({ page: 1, limit: 10 });
            setStudents(response.students || []);

            // Reset pagination
            if (response.pagination) {
                setCurrentPage(response.pagination.currentPage);
                setTotalPages(response.pagination.totalPages);
            }

            // Show success message
            setSuccessMessage(`Student "${formData.username}" added successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);

            // Reset form and close modal
            setFormData({ username: '', password: '' });
            setShowAddModal(false);
        } catch (err) {
            console.error('Error creating student:', err);
            setFormError(err.response?.data?.message || err.message || 'Failed to create student');
        } finally {
            setFormLoading(false);
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowAddModal(false);
        setFormData({ username: '', password: '' });
        setFormError('');
    };

    // Handle delete student
    const handleDeleteStudent = async () => {
        if (!deleteModal.student) return;

        try {
            setDeleteLoading(true);
            setDeleteError('');

            await teacherAPI.deleteStudent(deleteModal.student.id);

            // Success - refresh students list (reset to page 1)
            const response = await teacherAPI.getAcademyStudents({ page: 1, limit: 10 });
            setStudents(response.students || []);

            // Reset pagination
            if (response.pagination) {
                setCurrentPage(response.pagination.currentPage);
                setTotalPages(response.pagination.totalPages);
            }

            // Show success message
            setSuccessMessage(`Student "${deleteModal.student.username}" deleted successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);

            // Close modal
            setDeleteModal({ show: false, student: null });
        } catch (err) {
            console.error('Error deleting student:', err);
            setDeleteError(err.response?.data?.message || err.message || 'Failed to delete student');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Open delete confirmation modal
    const openDeleteModal = (student, e) => {
        e.stopPropagation(); // Prevent row click
        setDeleteModal({ show: true, student });
        setDeleteError('');
    };

    // Close delete modal
    const closeDeleteModal = () => {
        if (!deleteLoading) {
            setDeleteModal({ show: false, student: null });
            setDeleteError('');
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading students..." />;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--spacing-3xl)' }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
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
                        <span>Students</span>
                    </div>

                    {/* Title */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
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
                                <Users size={24} strokeWidth={2} color="white" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                    Students
                                </h1>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                    {academy?.name || 'Your Academy'} - {students.length} {students.length === 1 ? 'Student' : 'Students'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn btn-primary"
                            >
                                + Add Student
                            </button>
                            <button
                                onClick={() => navigate(`/${academySlug}/dashboard`)}
                                className="btn btn-outline"
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container container--lg">
                {error && <ErrorAlert message={error} />}
                {successMessage && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'var(--success-light)',
                        border: '1px solid var(--success)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--success-dark)',
                        marginBottom: 'var(--spacing-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)'
                    }}>
                        <span>✅</span>
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Students List */}
                {students.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--spacing-3xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)', color: 'var(--text-muted)' }}>
                            <GraduationCap size={64} strokeWidth={1.5} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                            No Students Yet
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                            Students will appear here once they register for your academy.
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
                                            letterSpacing: '0.05em'
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
                                            letterSpacing: '0.05em'
                                        }}>
                                            Username
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Student ID
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Registered On
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'center',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr
                                            key={student.id}
                                            onClick={() => navigate(`/${academySlug}/students/${student.id}`)}
                                            style={{
                                                borderBottom: '1px solid var(--neutral-200)',
                                                transition: 'background-color 0.2s',
                                                cursor: 'pointer'
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
                                                fontFamily: 'monospace'
                                            }}>
                                                {student.id.substring(0, 8)}...
                                            </td>
                                            <td style={{
                                                padding: 'var(--spacing-md)',
                                                fontSize: '0.875rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                {formatDate(student.createdAt)}
                                            </td>
                                            <td style={{
                                                padding: 'var(--spacing-md)',
                                                textAlign: 'center'
                                            }}>
                                                <button
                                                    onClick={(e) => openDeleteModal(student, e)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid #dc3545',
                                                        color: '#dc3545',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#dc3545';
                                                        e.target.style.color = 'white';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = 'transparent';
                                                        e.target.style.color = '#dc3545';
                                                    }}
                                                    title="Delete student"
                                                >
                                                    <Trash2 size={16} strokeWidth={2} />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Load More Button */}
                        {students.length > 0 && currentPage < totalPages && (
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
                        {students.length > 0 && (
                            <div style={{
                                padding: 'var(--spacing-md)',
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                                fontSize: '0.875rem',
                                borderTop: currentPage < totalPages ? 'none' : '1px solid var(--neutral-200)'
                            }}>
                                Showing {students.length} students (Page {currentPage} of {totalPages})
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 'var(--spacing-md)'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: 'var(--shadow-xl)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: 'var(--spacing-xl)',
                            borderBottom: '1px solid var(--neutral-200)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: 'var(--text-primary)',
                                    margin: 0
                                }}>
                                    Add New Student
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        padding: '0',
                                        lineHeight: 1
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <p style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                marginTop: 'var(--spacing-sm)',
                                marginBottom: 0
                            }}>
                                Create a new student account for {academy?.name || 'your academy'}
                            </p>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleAddStudent} style={{ padding: 'var(--spacing-xl)' }}>
                            {formError && (
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    backgroundColor: 'var(--error-light)',
                                    border: '1px solid var(--error)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--error-dark)',
                                    marginBottom: 'var(--spacing-md)',
                                    fontSize: '0.875rem'
                                }}>
                                    {formError}
                                </div>
                            )}

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: 'var(--spacing-sm)'
                                }}>
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="Enter student username"
                                    className="input"
                                    required
                                    disabled={formLoading}
                                    style={{ width: '100%' }}
                                />
                                <p style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    marginTop: 'var(--spacing-xs)',
                                    marginBottom: 0
                                }}>
                                    This will be used for student login
                                </p>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: 'var(--spacing-sm)'
                                }}>
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                    className="input"
                                    required
                                    minLength={6}
                                    disabled={formLoading}
                                    style={{ width: '100%' }}
                                />
                                <p style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    marginTop: 'var(--spacing-xs)',
                                    marginBottom: 0
                                }}>
                                    Must be at least 6 characters long
                                </p>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                display: 'flex',
                                gap: 'var(--spacing-md)',
                                justifyContent: 'flex-end',
                                marginTop: 'var(--spacing-xl)'
                            }}>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn btn-outline"
                                    disabled={formLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={formLoading}
                                >
                                    {formLoading ? 'Creating...' : 'Create Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && deleteModal.student && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 'var(--spacing-md)'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: 'var(--shadow-xl)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: 'var(--spacing-xl)',
                            borderBottom: '1px solid var(--neutral-200)'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#dc3545',
                                marginBottom: 'var(--spacing-sm)'
                            }}>
                                ⚠️ Delete Student
                            </h2>
                            <p style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                marginTop: 'var(--spacing-sm)',
                                marginBottom: 0
                            }}>
                                Are you sure you want to delete this student?
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: 'var(--spacing-xl)' }}>
                            {deleteError && (
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    backgroundColor: '#fee',
                                    border: '1px solid #dc3545',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--error-dark)',
                                    marginBottom: 'var(--spacing-md)',
                                    fontSize: '0.875rem'
                                }}>
                                    {deleteError}
                                </div>
                            )}

                            <div style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-lg)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--primary-purple)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.5rem',
                                        fontWeight: '600'
                                    }}>
                                        {deleteModal.student.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                            {deleteModal.student.username}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            ID: {deleteModal.student.id.substring(0, 8)}...
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffc107',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                color: '#856404'
                            }}>
                                <strong>⚠️ Warning:</strong> This action cannot be undone. If this student has taken any exams, deletion will be prevented to maintain data integrity.
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                display: 'flex',
                                gap: 'var(--spacing-md)',
                                justifyContent: 'flex-end',
                                marginTop: 'var(--spacing-xl)'
                            }}>
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className="btn btn-outline"
                                    disabled={deleteLoading}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteStudent}
                                    disabled={deleteLoading}
                                    style={{
                                        background: deleteLoading ? '#d1d5db' : '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        cursor: deleteLoading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!deleteLoading) {
                                            e.target.style.background = '#c82333';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!deleteLoading) {
                                            e.target.style.background = '#dc3545';
                                        }
                                    }}
                                >
                                    {deleteLoading ? 'Deleting...' : 'Delete Student'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsList;
