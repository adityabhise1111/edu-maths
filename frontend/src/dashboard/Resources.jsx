import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { resourcesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import DashboardLayout from './DashboardLayout/DashboardLayout';
import { 
    FolderOpen, 
    Upload, 
    FileText, 
    Image, 
    File, 
    Trash2, 
    Download, 
    AlertTriangle,
    X,
    Plus,
    Eye
} from 'lucide-react';

const Resources = () => {
    const { academySlug } = useParams();
    const navigate = useNavigate();
    const { isLoaded, isSignedIn, academy } = useAuth();
    const fileInputRef = useRef(null);

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Upload modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({ title: '', description: '', file: null });
    const [uploadError, setUploadError] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);

    // Delete modal state
    const [deleteModal, setDeleteModal] = useState({ show: false, resource: null });
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Preview modal state
    const [previewModal, setPreviewModal] = useState({ show: false, resource: null });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResources, setTotalResources] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/login');
        }
    }, [isLoaded, isSignedIn, navigate]);

    // Fetch resources
    useEffect(() => {
        if (!isSignedIn || !academy?.id) return;

        const fetchResources = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await resourcesAPI.getAcademyResources(academy.id, { page: 1, limit: 12 });
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
    }, [isSignedIn, academy?.id]);

    // Load more resources
    const loadMoreResources = async () => {
        if (currentPage >= totalPages || !academy?.id) return;

        try {
            setLoadingMore(true);
            const nextPage = currentPage + 1;
            const response = await resourcesAPI.getAcademyResources(academy.id, { page: nextPage, limit: 12 });

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

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setUploadError('Only PDF and image files are allowed');
                return;
            }
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setUploadError('File size must be less than 10MB');
                return;
            }
            setUploadData(prev => ({ ...prev, file }));
            setUploadError('');
        }
    };

    // Handle upload submission
    const handleUpload = async (e) => {
        e.preventDefault();

        if (!uploadData.title.trim()) {
            setUploadError('Title is required');
            return;
        }
        if (!uploadData.file) {
            setUploadError('Please select a file');
            return;
        }

        try {
            setUploadLoading(true);
            setUploadError('');

            const formData = new FormData();
            formData.append('file', uploadData.file);
            formData.append('title', uploadData.title.trim());
            if (uploadData.description.trim()) {
                formData.append('description', uploadData.description.trim());
            }

            await resourcesAPI.uploadResource(formData);

            // Refresh resources list
            const response = await resourcesAPI.getAcademyResources(academy.id, { page: 1, limit: 12 });
            setResources(response.resources || []);
            setTotalResources(response.totalResources || 0);

            if (response.pagination) {
                setCurrentPage(response.pagination.currentPage);
                setTotalPages(response.pagination.totalPages);
            }

            // Show success message
            setSuccessMessage(`"${uploadData.title}" uploaded successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);

            // Reset form and close modal
            setUploadData({ title: '', description: '', file: null });
            setShowUploadModal(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Error uploading resource:', err);
            setUploadError(err.response?.data?.message || err.message || 'Failed to upload resource');
        } finally {
            setUploadLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteModal.resource) return;

        try {
            setDeleteLoading(true);
            setDeleteError('');

            await resourcesAPI.deleteResource(deleteModal.resource.id);

            // Refresh resources list
            const response = await resourcesAPI.getAcademyResources(academy.id, { page: 1, limit: 12 });
            setResources(response.resources || []);
            setTotalResources(response.totalResources || 0);

            if (response.pagination) {
                setCurrentPage(response.pagination.currentPage);
                setTotalPages(response.pagination.totalPages);
            }

            // Show success message
            setSuccessMessage(`"${deleteModal.resource.title}" deleted successfully!`);
            setTimeout(() => setSuccessMessage(''), 3000);

            setDeleteModal({ show: false, resource: null });
        } catch (err) {
            console.error('Error deleting resource:', err);
            setDeleteError(err.response?.data?.message || err.message || 'Failed to delete resource');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Close upload modal
    const handleCloseUploadModal = () => {
        if (!uploadLoading) {
            setShowUploadModal(false);
            setUploadData({ title: '', description: '', file: null });
            setUploadError('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

    // Get file icon based on type
    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'pdf':
                return <FileText size={24} color="#dc2626" />;
            case 'image':
                return <Image size={24} color="#2563eb" />;
            default:
                return <File size={24} color="#6b7280" />;
        }
    };

    // Get file type badge color
    const getFileTypeBadge = (fileType) => {
        const config = {
            pdf: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'PDF' },
            image: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'Image' },
            document: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb', label: 'Doc' },
        };
        return config[fileType] || config.document;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <LoadingSpinner message="Loading resources..." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--spacing-3xl)' }}>
                {/* Header */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    padding: 'var(--spacing-xl) 0',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    <div className="container">
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
                                    <FolderOpen size={24} strokeWidth={2} color="white" />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                        Resources
                                    </h1>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                        {academy?.name || 'Your Academy'} - {totalResources} {totalResources === 1 ? 'Resource' : 'Resources'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="btn btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Upload size={18} />
                                Upload Resource
                            </button>
                        </div>
                    </div>
                </div>

                <div className="container container--lg">
                    {error && <ErrorAlert message={error} onClose={() => setError('')} />}
                    
                    {successMessage && (
                        <div style={{
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'var(--success-light, #f0fdf4)',
                            border: '1px solid var(--success, #22c55e)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--success-dark, #166534)',
                            marginBottom: 'var(--spacing-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)'
                        }}>
                            ✓ {successMessage}
                        </div>
                    )}

                    {/* Resources Grid */}
                    {resources.length === 0 ? (
                        <div style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-color)',
                            padding: 'var(--spacing-3xl)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--spacing-lg)'
                            }}>
                                <FolderOpen size={32} color="var(--text-secondary)" />
                            </div>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                                No resources yet
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                                Upload study materials, notes, or images for your students
                            </p>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Plus size={18} />
                                Upload First Resource
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: 'var(--spacing-lg)'
                            }}>
                                {resources.map((resource) => {
                                    const badge = getFileTypeBadge(resource.fileType);
                                    const isImage = resource.fileType === 'image';

                                    return (
                                        <div
                                            key={resource.id}
                                            style={{
                                                backgroundColor: 'var(--bg-card)',
                                                borderRadius: 'var(--radius-lg)',
                                                border: '1px solid var(--border-color)',
                                                overflow: 'hidden',
                                                transition: 'box-shadow 0.2s, transform 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            {/* Preview/Thumbnail */}
                                            <div style={{
                                                height: '140px',
                                                backgroundColor: 'var(--bg-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderBottom: '1px solid var(--border-color)',
                                                overflow: 'hidden'
                                            }}>
                                                {isImage ? (
                                                    <img
                                                        src={resource.fileUrl}
                                                        alt={resource.title}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '64px',
                                                        height: '64px',
                                                        backgroundColor: 'var(--bg-card)',
                                                        borderRadius: 'var(--radius-md)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {getFileIcon(resource.fileType)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div style={{ padding: 'var(--spacing-md)' }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                                    <h3 style={{
                                                        fontSize: '1rem',
                                                        fontWeight: '600',
                                                        color: 'var(--text-primary)',
                                                        margin: 0,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        flex: 1,
                                                        marginRight: 'var(--spacing-sm)'
                                                    }}>
                                                        {resource.title}
                                                    </h3>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        padding: '0.125rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: '600',
                                                        backgroundColor: badge.bg,
                                                        color: badge.color,
                                                        border: `1px solid ${badge.border}`,
                                                        textTransform: 'uppercase',
                                                        flexShrink: 0
                                                    }}>
                                                        {badge.label}
                                                    </span>
                                                </div>

                                                {resource.description && (
                                                    <p style={{
                                                        fontSize: '0.8125rem',
                                                        color: 'var(--text-secondary)',
                                                        margin: '0 0 var(--spacing-sm) 0',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {resource.description}
                                                    </p>
                                                )}

                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    marginBottom: 'var(--spacing-md)'
                                                }}>
                                                    {formatFileSize(resource.fileSize)} · {formatDate(resource.createdAt)}
                                                </div>

                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                    <a
                                                        href={resource.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '0.375rem',
                                                            padding: '0.5rem',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: '500',
                                                            color: 'var(--primary-purple)',
                                                            backgroundColor: 'transparent',
                                                            border: '1px solid var(--primary-purple)',
                                                            borderRadius: 'var(--radius-md)',
                                                            textDecoration: 'none',
                                                            transition: 'background-color 0.15s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.06)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </a>
                                                    <a
                                                        href={resource.fileUrl}
                                                        download={resource.fileName}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: '0.5rem 0.75rem',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: '500',
                                                            color: 'var(--text-secondary)',
                                                            backgroundColor: 'var(--bg-secondary)',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: 'var(--radius-md)',
                                                            textDecoration: 'none',
                                                            transition: 'background-color 0.15s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary, #e5e7eb)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Download size={14} />
                                                    </a>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteModal({ show: true, resource });
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: '0.5rem 0.75rem',
                                                            fontSize: '0.8125rem',
                                                            color: '#dc2626',
                                                            backgroundColor: 'transparent',
                                                            border: '1px solid #fecaca',
                                                            borderRadius: 'var(--radius-md)',
                                                            cursor: 'pointer',
                                                            transition: 'background-color 0.15s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Load More */}
                            {currentPage < totalPages && (
                                <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                                    <button
                                        onClick={loadMoreResources}
                                        disabled={loadingMore}
                                        className="btn btn-outline"
                                        style={{ minWidth: '200px' }}
                                    >
                                        {loadingMore ? 'Loading...' : `Load More (${currentPage}/${totalPages})`}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 'var(--spacing-md)'
                    }} onClick={handleCloseUploadModal}>
                        <div style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            width: '100%',
                            maxWidth: '480px',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }} onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--spacing-lg)',
                                borderBottom: '1px solid var(--border-color)'
                            }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    Upload Resource
                                </h2>
                                <button
                                    onClick={handleCloseUploadModal}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleUpload} style={{ padding: 'var(--spacing-lg)' }}>
                                {uploadError && (
                                    <div style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        backgroundColor: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        borderRadius: 'var(--radius-md)',
                                        color: '#dc2626',
                                        fontSize: '0.875rem',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        {uploadError}
                                    </div>
                                )}

                                {/* Title */}
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: 'var(--text-primary)',
                                        marginBottom: 'var(--spacing-xs)'
                                    }}>
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadData.title}
                                        onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Chapter 1 Notes"
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem 0.875rem',
                                            fontSize: '0.9375rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            backgroundColor: 'var(--bg-card)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                {/* Description */}
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: 'var(--text-primary)',
                                        marginBottom: 'var(--spacing-xs)'
                                    }}>
                                        Description (optional)
                                    </label>
                                    <textarea
                                        value={uploadData.description}
                                        onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description of the resource"
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem 0.875rem',
                                            fontSize: '0.9375rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            backgroundColor: 'var(--bg-card)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                {/* File Upload */}
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        color: 'var(--text-primary)',
                                        marginBottom: 'var(--spacing-xs)'
                                    }}>
                                        File *
                                    </label>
                                    <div
                                        style={{
                                            border: `2px dashed ${uploadData.file ? 'var(--primary-purple)' : 'var(--border-color)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            padding: 'var(--spacing-lg)',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            backgroundColor: uploadData.file ? 'rgba(124,58,237,0.04)' : 'var(--bg-secondary)',
                                            transition: 'border-color 0.15s, background-color 0.15s'
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                        {uploadData.file ? (
                                            <>
                                                <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                                                    {getFileIcon(uploadData.file.type === 'application/pdf' ? 'pdf' : 'image')}
                                                </div>
                                                <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-primary)' }}>
                                                    {uploadData.file.name}
                                                </p>
                                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                    {formatFileSize(uploadData.file.size)}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={32} color="var(--text-secondary)" style={{ marginBottom: 'var(--spacing-sm)' }} />
                                                <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-primary)' }}>
                                                    Click to select a file
                                                </p>
                                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                    PDF or images only (max 10MB)
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={handleCloseUploadModal}
                                        disabled={uploadLoading}
                                        className="btn btn-outline"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploadLoading}
                                        className="btn btn-primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        {uploadLoading ? (
                                            <>Uploading...</>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Upload
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteModal.show && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 'var(--spacing-md)'
                    }} onClick={() => !deleteLoading && setDeleteModal({ show: false, resource: null })}>
                        <div style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            width: '100%',
                            maxWidth: '400px',
                            padding: 'var(--spacing-xl)'
                        }} onClick={(e) => e.stopPropagation()}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#fef2f2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--spacing-md)'
                            }}>
                                <AlertTriangle size={24} color="#dc2626" />
                            </div>

                            <h3 style={{ textAlign: 'center', margin: '0 0 var(--spacing-sm)', color: 'var(--text-primary)' }}>
                                Delete Resource?
                            </h3>
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                                Are you sure you want to delete "<strong>{deleteModal.resource?.title}</strong>"? This action cannot be undone.
                            </p>

                            {deleteError && (
                                <div style={{
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    borderRadius: 'var(--radius-md)',
                                    color: '#dc2626',
                                    fontSize: '0.875rem',
                                    marginBottom: 'var(--spacing-md)'
                                }}>
                                    {deleteError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button
                                    onClick={() => setDeleteModal({ show: false, resource: null })}
                                    disabled={deleteLoading}
                                    className="btn btn-outline"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                    style={{
                                        flex: 1,
                                        padding: '0.625rem 1rem',
                                        fontSize: '0.9375rem',
                                        fontWeight: '500',
                                        color: 'white',
                                        backgroundColor: '#dc2626',
                                        border: 'none',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: deleteLoading ? 'not-allowed' : 'pointer',
                                        opacity: deleteLoading ? 0.6 : 1
                                    }}
                                >
                                    {deleteLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Resources;
