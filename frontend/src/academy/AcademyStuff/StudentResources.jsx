import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
import { studentAPI, academyAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import {
    FolderOpen,
    FileText,
    Image,
    File,
    Download,
    Eye,
    X,
    ArrowLeft,
    LogOut
} from 'lucide-react';

const StudentResources = () => {
    const { academySlug } = useParams();
    const navigate = useNavigate();
    const { student, isAuthenticated, logout } = useStudentAuth();

    // Academy state
    const [academy, setAcademy] = useState(null);
    const [academyLoading, setAcademyLoading] = useState(true);

    // Resources state
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Preview modal state
    const [previewModal, setPreviewModal] = useState({ show: false, resource: null });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResources, setTotalResources] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate(`/${academySlug}/login`);
        }
    }, [isAuthenticated, academySlug, navigate]);

    // Fetch academy details
    useEffect(() => {
        const fetchAcademy = async () => {
            try {
                const response = await academyAPI.getBySlug(academySlug);
                if (response.academy) {
                    setAcademy(response.academy);
                }
            } catch (err) {
                console.error('Error fetching academy:', err);
            } finally {
                setAcademyLoading(false);
            }
        };

        fetchAcademy();
    }, [academySlug]);

    // Fetch resources
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchResources = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await studentAPI.getResources({ page: 1, limit: 12 });
                setResources(response.resources || []);
                setTotalResources(response.totalResources || 0);

                if (response.pagination) {
                    setCurrentPage(response.pagination.currentPage);
                    setTotalPages(response.pagination.totalPages);
                }
            } catch (err) {
                console.error('Error fetching resources:', err);
                setError(err.message || 'Failed to load resources');
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [isAuthenticated]);

    // Load more resources
    const loadMoreResources = async () => {
        if (currentPage >= totalPages) return;

        try {
            setLoadingMore(true);
            const nextPage = currentPage + 1;
            const response = await studentAPI.getResources({ page: nextPage, limit: 12 });

            setResources(prev => [...prev, ...(response.resources || [])]);

            if (response.pagination) {
                setCurrentPage(response.pagination.currentPage);
                setTotalPages(response.pagination.totalPages);
            }
        } catch (err) {
            console.error('Error loading more resources:', err);
            setError('Failed to load more resources');
        } finally {
            setLoadingMore(false);
        }
    };

    // Get file icon
    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'pdf':
                return <FileText size={24} className="text-red-500" />;
            case 'image':
                return <Image size={24} className="text-blue-500" />;
            default:
                return <File size={24} className="text-gray-500" />;
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Handle preview
    const openPreview = (resource) => {
        setPreviewModal({ show: true, resource });
    };

    const closePreview = () => {
        setPreviewModal({ show: false, resource: null });
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        navigate(`/${academySlug}/login`);
    };

    // Show loading
    if (loading && academyLoading) {
        return <LoadingSpinner fullScreen message="Loading resources..." />;
    }

    return (
        <div style={{ minHeight: 'calc(100vh - 200px)' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary-purple), var(--primary-purple-dark))',
                padding: 'var(--spacing-2xl) var(--spacing-md)',
                color: 'white',
                position: 'relative',
            }}>
                {/* Theme Toggle and Logout */}
                <div style={{
                    position: 'absolute',
                    top: 'var(--spacing-md)',
                    right: 'var(--spacing-md)',
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    alignItems: 'center'
                }}>
                    <ThemeToggle />
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
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>

                <div className="container">
                    {/* Back button */}
                    <Link
                        to={`/${academySlug}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                            textDecoration: 'none',
                            marginBottom: 'var(--spacing-md)',
                            fontSize: '0.9rem',
                        }}
                    >
                        <ArrowLeft size={18} />
                        Back to Academy
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <FolderOpen size={40} />
                        <div>
                            <h1 style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                marginBottom: 'var(--spacing-xs)',
                            }}>
                                Resources
                            </h1>
                            <p style={{ opacity: '0.9' }}>
                                {academy?.name || academySlug} • {totalResources} resource{totalResources !== 1 ? 's' : ''} available
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resources Content */}
            <div className="container py-6">
                {/* Error State */}
                {error && (
                    <ErrorAlert message={error} />
                )}

                {/* Loading State */}
                {loading && !error && (
                    <div className="text-center py-6">
                        <LoadingSpinner message="Loading resources..." />
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && resources.length === 0 && (
                    <div className="card text-center" style={{ padding: 'var(--spacing-3xl)' }}>
                        <FolderOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }} />
                        <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>
                            No Resources Yet
                        </h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Your teacher hasn't shared any resources yet. Check back later!
                        </p>
                    </div>
                )}

                {/* Resources Grid */}
                {!loading && !error && resources.length > 0 && (
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            {resources.map((resource) => (
                                <div key={resource.id} className="card card--interactive">
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 'var(--spacing-md)',
                                        marginBottom: 'var(--spacing-md)',
                                    }}>
                                        <div style={{
                                            padding: 'var(--spacing-sm)',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                        }}>
                                            {getFileIcon(resource.fileType)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                color: 'var(--text-primary)',
                                                marginBottom: 'var(--spacing-xs)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {resource.title}
                                            </h3>
                                            <p style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)',
                                            }}>
                                                {formatFileSize(resource.fileSize)} • {formatDate(resource.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {resource.description && (
                                        <p style={{
                                            fontSize: '0.9rem',
                                            color: 'var(--text-secondary)',
                                            marginBottom: 'var(--spacing-md)',
                                            lineHeight: '1.5',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}>
                                            {resource.description}
                                        </p>
                                    )}

                                    <div style={{
                                        display: 'flex',
                                        gap: 'var(--spacing-sm)',
                                        marginTop: 'auto',
                                    }}>
                                        <button
                                            onClick={() => openPreview(resource)}
                                            className="btn btn-outline btn-sm"
                                            style={{ flex: 1 }}
                                        >
                                            <Eye size={16} style={{ marginRight: '0.25rem' }} />
                                            Preview
                                        </button>
                                        <a
                                            href={resource.fileUrl}
                                            download={resource.fileName}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary btn-sm"
                                            style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                                        >
                                            <Download size={16} style={{ marginRight: '0.25rem' }} />
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {currentPage < totalPages && (
                            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                                <button
                                    onClick={loadMoreResources}
                                    disabled={loadingMore}
                                    className="btn btn-outline"
                                    style={{ minWidth: '200px' }}
                                >
                                    {loadingMore ? 'Loading...' : `Load More (Page ${currentPage + 1} of ${totalPages})`}
                                </button>
                            </div>
                        )}

                        {/* Pagination Info */}
                        <div style={{
                            textAlign: 'center',
                            marginTop: 'var(--spacing-md)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem'
                        }}>
                            Showing {resources.length} of {totalResources} resources
                        </div>
                    </>
                )}
            </div>

            {/* Preview Modal */}
            {previewModal.show && previewModal.resource && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 'var(--spacing-md)',
                    }}
                    onClick={closePreview}
                >
                    <div
                        style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: 'var(--radius-lg)',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            width: '900px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            borderBottom: '1px solid var(--border-color)',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {previewModal.resource.title}
                                </h2>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    {previewModal.resource.fileName}
                                </p>
                            </div>
                            <button
                                onClick={closePreview}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 'var(--spacing-xs)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--bg-secondary)',
                        }}>
                            {previewModal.resource.fileType === 'pdf' ? (
                                <iframe
                                    src={previewModal.resource.fileUrl}
                                    style={{
                                        width: '100%',
                                        height: '70vh',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                    title={previewModal.resource.title}
                                />
                            ) : previewModal.resource.fileType === 'image' ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img
                                        src={previewModal.resource.fileUrl}
                                        alt={previewModal.resource.title}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '70vh',
                                            objectFit: 'contain',
                                            borderRadius: 'var(--radius-md)',
                                        }}
                                    />
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
                                    <File size={64} style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }} />
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        Preview not available for this file type.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 'var(--spacing-sm)',
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            borderTop: '1px solid var(--border-color)',
                        }}>
                            <button onClick={closePreview} className="btn btn-secondary">
                                Close
                            </button>
                            <a
                                href={previewModal.resource.fileUrl}
                                download={previewModal.resource.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ textDecoration: 'none' }}
                            >
                                <Download size={16} style={{ marginRight: '0.5rem' }} />
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentResources;
