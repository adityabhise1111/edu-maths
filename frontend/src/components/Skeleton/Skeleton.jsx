import React from 'react';
import './Skeleton.css';

// Base Skeleton component
export const Skeleton = ({ width, height, borderRadius, className = '' }) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width: width || '100%',
                height: height || '1rem',
                borderRadius: borderRadius || 'var(--radius-md)',
            }}
        />
    );
};

// Skeleton Text (for headings, paragraphs)
export const SkeletonText = ({ lines = 1, className = '' }) => {
    return (
        <div className={`skeleton-text ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    height="1rem"
                    width={index === lines - 1 ? '80%' : '100%'}
                    className="skeleton-text-line"
                />
            ))}
        </div>
    );
};

// Skeleton Card (for stat cards, exam cards, etc.)
export const SkeletonCard = ({ height = '200px', className = '' }) => {
    return (
        <div className={`skeleton-card card ${className}`}>
            <div className="skeleton-card-header">
                <Skeleton width="48px" height="48px" borderRadius="var(--radius-lg)" />
                <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height="1.5rem" />
                    <Skeleton width="40%" height="1rem" style={{ marginTop: '0.5rem' }} />
                </div>
            </div>
            <div className="skeleton-card-content">
                <SkeletonText lines={2} />
            </div>
        </div>
    );
};

// Skeleton Table Row
export const SkeletonTableRow = ({ columns = 5 }) => {
    return (
        <tr className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, index) => (
                <td key={index} style={{ padding: 'var(--spacing-md)' }}>
                    <Skeleton height="1rem" width={index === 0 ? '80%' : '60%'} />
                </td>
            ))}
        </tr>
    );
};

// Skeleton Table (complete table with header and rows)
export const SkeletonTable = ({ rows = 5, columns = 5, className = '' }) => {
    return (
        <div className={`skeleton-table ${className}`} style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        {Array.from({ length: columns }).map((_, index) => (
                            <th
                                key={index}
                                style={{
                                    textAlign: 'left',
                                    padding: 'var(--spacing-md)',
                                }}
                            >
                                <Skeleton height="1rem" width="70%" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <SkeletonTableRow key={rowIndex} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Skeleton Avatar
export const SkeletonAvatar = ({ size = '3rem', className = '' }) => {
    return (
        <Skeleton
            width={size}
            height={size}
            borderRadius="50%"
            className={`skeleton-avatar ${className}`}
        />
    );
};

// Skeleton Button
export const SkeletonButton = ({ width = '150px', height = '40px', className = '' }) => {
    return (
        <Skeleton
            width={width}
            height={height}
            borderRadius="var(--radius-lg)"
            className={`skeleton-button ${className}`}
        />
    );
};

// Dashboard Stats Skeleton (3 stat cards)
export const SkeletonDashboardStats = () => {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-2xl)',
            }}
        >
            {[1, 2, 3].map((i) => (
                <div key={i} className="card skeleton-stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <Skeleton width="3rem" height="3rem" borderRadius="var(--radius-lg)" />
                        <Skeleton width="3rem" height="2rem" />
                    </div>
                    <Skeleton width="60%" height="1.125rem" style={{ marginBottom: 'var(--spacing-xs)' }} />
                    <Skeleton width="80%" height="0.875rem" />
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
