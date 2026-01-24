// Students List Loading Skeleton Component
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

export const StudentsListSkeleton = () => {
    return (
        <SkeletonTheme baseColor="#f0f0f0" highlightColor="#e0e0e0">
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--spacing-3xl)' }}>
                {/* Header Skeleton */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--neutral-200)',
                    padding: 'var(--spacing-xl) 0',
                    marginBottom: 'var(--spacing-xl)'
                }}>
                    <div className="container">
                        {/* Breadcrumb Skeleton */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <Skeleton width={150} height={16} />
                        </div>

                        {/* Title Skeleton */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <Skeleton width={48} height={48} borderRadius={8} />
                                <div>
                                    <Skeleton width={150} height={30} style={{ marginBottom: '0.25rem' }} />
                                    <Skeleton width={200} height={16} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <Skeleton width={120} height={40} borderRadius={8} />
                                <Skeleton width={150} height={40} borderRadius={8} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container container--lg">
                    {/* Students Table Skeleton */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--neutral-200)' }}>
                                        {['#', 'Username', 'Student ID', 'Registered On', 'Actions'].map(header => (
                                            <th key={header} style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>
                                                <Skeleton width={80} height={16} />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--neutral-200)' }}>
                                            <td style={{ padding: 'var(--spacing-md)' }}>
                                                <Skeleton width={20} height={16} />
                                            </td>
                                            <td style={{ padding: 'var(--spacing-md)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                    <Skeleton circle width={32} height={32} />
                                                    <Skeleton width={120} height={18} />
                                                </div>
                                            </td>
                                            <td style={{ padding: 'var(--spacing-md)' }}>
                                                <Skeleton width={100} height={16} />
                                            </td>
                                            <td style={{ padding: 'var(--spacing-md)' }}>
                                                <Skeleton width={150} height={16} />
                                            </td>
                                            <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                                                    <Skeleton width={80} height={36} borderRadius={6} />
                                                    <Skeleton width={100} height={36} borderRadius={6} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
};
