// Students Performance Loading Skeleton Component
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const PerformanceSkeleton = () => {
    return (
        <SkeletonTheme baseColor="var(--bg-secondary)" highlightColor="var(--bg-primary)">
            <div style={{ minHeight: 'calc(100vh - 120px)', backgroundColor: 'var(--bg-secondary)', padding: 'var(--spacing-xl)' }}>
                {/* Header Skeleton */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-xl)',
                    marginBottom: 'var(--spacing-xl)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                    {/* Title */}
                    <Skeleton width={300} height={32} style={{ marginBottom: 'var(--spacing-sm)' }} />
                    <Skeleton width={250} height={20} />

                    {/* Stats Cards Skeleton */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--spacing-md)',
                        marginTop: 'var(--spacing-xl)'
                    }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{
                                padding: 'var(--spacing-lg)',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--neutral-200)'
                            }}>
                                <Skeleton width={100} height={12} style={{ marginBottom: 'var(--spacing-xs)' }} />
                                <Skeleton width={80} height={40} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Table Skeleton */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--neutral-200)' }}>
                                    {['Student', 'Exams Taken', 'Average Score', 'Performance', 'Last Activity', 'Actions'].map(header => (
                                        <th key={header} style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>
                                            <Skeleton width={100} height={16} />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: 'var(--spacing-md)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <Skeleton circle width={40} height={40} />
                                                <div>
                                                    <Skeleton width={150} height={18} style={{ marginBottom: '0.25rem' }} />
                                                    <Skeleton width={120} height={14} />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                                            <Skeleton width={60} height={20} />
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)' }}>
                                            <Skeleton width={80} height={32} />
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)' }}>
                                            <Skeleton width={100} height={28} borderRadius={12} />
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)' }}>
                                            <Skeleton width={100} height={16} style={{ marginBottom: '0.25rem' }} />
                                            <Skeleton width={80} height={14} />
                                        </td>
                                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                            <Skeleton width={120} height={36} borderRadius={6} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Load More Button Skeleton */}
                    <div style={{
                        padding: 'var(--spacing-lg)',
                        textAlign: 'center',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        <Skeleton width={150} height={40} borderRadius={8} />
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
};
