// Teacher Dashboard Loading Skeleton Component
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

export const DashboardSkeleton = () => {
    return (
        <SkeletonTheme baseColor="#f0f0f0" highlightColor="#e0e0e0">
            <div style={{ minHeight: 'calc(100vh - 200px)', backgroundColor: 'var(--bg-secondary)' }}>
                {/* Dashboard Header Skeleton */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-pink))',
                    padding: 'var(--spacing-3xl) var(--spacing-md)',
                    color: 'white'
                }}>
                    <div className="container">
                        <Skeleton width={300} height={32} style={{ marginBottom: 'var(--spacing-sm)' }} />
                        <Skeleton width={200} height={20} />
                    </div>
                </div>

                {/* Dashboard Content Skeleton */}
                <div className="py-6">
                    <div className="container">
                        {/* Stats Cards Skeleton */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: 'var(--spacing-lg)',
                            marginBottom: 'var(--spacing-2xl)',
                        }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="card">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                                        <Skeleton circle width={48} height={48} />
                                        <Skeleton width={80} height={40} />
                                    </div>
                                    <Skeleton width={150} height={24} style={{ marginBottom: 'var(--spacing-xs)' }} />
                                    <Skeleton width={180} height={16} />
                                </div>
                            ))}
                        </div>

                        {/* Create Exam Button Skeleton */}
                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <Skeleton width={200} height={44} borderRadius={8} />
                        </div>

                        {/* Exams Table Skeleton */}
                        <div className="card">
                            <Skeleton width={150} height={28} style={{ marginBottom: 'var(--spacing-lg)' }} />
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                            {['Exam Title', 'Difficulty', 'Duration', 'Start Time', 'Attempts', 'Actions'].map(header => (
                                                <th key={header} style={{ textAlign: 'left', padding: 'var(--spacing-md)' }}>
                                                    <Skeleton width={80} height={16} />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    <Skeleton width={200} height={20} style={{ marginBottom: '0.25rem' }} />
                                                    <Skeleton width={100} height={14} />
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)' }}><Skeleton width={60} height={24} borderRadius={12} /></td>
                                                <td style={{ padding: 'var(--spacing-md)' }}><Skeleton width={60} height={16} /></td>
                                                <td style={{ padding: 'var(--spacing-md)' }}>
                                                    <Skeleton width={100} height={14} style={{ marginBottom: '0.25rem' }} />
                                                    <Skeleton width={80} height={14} />
                                                </td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}><Skeleton width={30} height={16} /></td>
                                                <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                                                        <Skeleton width={100} height={36} borderRadius={6} />
                                                        <Skeleton width={80} height={36} borderRadius={6} />
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
            </div>
        </SkeletonTheme>
    );
};
