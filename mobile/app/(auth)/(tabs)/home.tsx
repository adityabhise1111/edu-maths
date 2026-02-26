import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../../store/AuthContext';
import { apiClient } from '../../../services/api';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

interface PerformanceData {
    overallStats: {
        totalExamsAttempted: number;
        totalExamsSubmitted: number;
        averageScore: number;
        lastExamScore: number | null;
    };
}

interface Exam {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    difficulty: string;
}

interface ExamAttempt {
    examId: string;
    status: 'active' | 'submitted' | 'expired';
}

export default function HomeScreen() {
    const { student } = useAuth();
    const router = useRouter();
    const [performance, setPerformance] = useState<PerformanceData | null>(null);
    const [nextExam, setNextExam] = useState<Exam | null>(null);
    const [nextExamStatus, setNextExamStatus] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [perfRes, examsRes, attemptsRes] = await Promise.all([
                apiClient.get<PerformanceData>('/students/performance'),
                apiClient.get<any>(`/exams/academy/${student?.academySlug}`),
                apiClient.get<ExamAttempt[]>('/students/exam-attempts')
            ]);

            if (perfRes.success && perfRes.data) {
                setPerformance(perfRes.data);
            }

            if (examsRes.success && examsRes.data) {
                const examsList = examsRes.data.exams || [];
                const sortedExams = examsList.sort((a: Exam, b: Exam) =>
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                );

                const now = new Date();
                // Find first exam that is either live or upcoming and not submitted
                const userAttempts = attemptsRes.success ? attemptsRes.data || [] : [];

                const upcoming = sortedExams.find((e: Exam) => {
                    const endTime = new Date(e.endTime);
                    const attempt = userAttempts.find(a => a.examId === e.id);
                    // Filter out already submitted or expired exams
                    return endTime > now && (!attempt || attempt.status !== 'submitted');
                });

                if (upcoming) {
                    setNextExam(upcoming);
                    const startTime = new Date(upcoming.startTime);
                    if (now >= startTime) {
                        setNextExamStatus('Live Now');
                    } else {
                        setNextExamStatus(`Starts: ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
                    }
                } else {
                    setNextExam(null);
                }
            }
        } catch (error) {
            // console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleExamAction = () => {
        if (!nextExam) return;
        router.push({
            pathname: '/(auth)/exam-gate',
            params: { examId: nextExam.id, title: nextExam.title }
        });
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.content}>
                {/* Welcome Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.studentName}>{student?.username} 👋</Text>
                        <View style={styles.academyBadge}>
                            <Ionicons name="school" size={14} color="#007AFF" />
                            <Text style={styles.academyName}>{student?.academyName}</Text>
                        </View>
                    </View>
                </View>

                {/* Next Exam Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Next Milestone</Text>
                    {nextExam ? (
                        <TouchableOpacity style={styles.nextExamCard} onPress={handleExamAction} activeOpacity={0.9}>
                            <View style={styles.nextExamHeader}>
                                <View style={styles.liveIndicatorContainer}>
                                    {nextExamStatus === 'Live Now' && <View style={styles.liveDot} />}
                                    <Text style={[styles.nextExamStatus, nextExamStatus === 'Live Now' && { color: '#34c759' }]}>
                                        {nextExamStatus}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </View>
                            <Text style={styles.nextExamTitle}>{nextExam.title}</Text>
                            <View style={styles.nextExamFooter}>
                                <View style={styles.metaRow}>
                                    <Ionicons name="time-outline" size={16} color="#666" />
                                    <Text style={styles.metaText}>
                                        Ends: {new Date(nextExam.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons name="bar-chart-outline" size={16} color="#666" />
                                    <Text style={styles.metaText}>{nextExam.difficulty.toUpperCase()}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.startButton} onPress={handleExamAction}>
                                <Text style={styles.startButtonText}>
                                    {nextExamStatus === 'Live Now' ? 'Resume / Start Exam' : 'View Details'}
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.emptyExamCard}>
                            <Ionicons name="calendar-outline" size={32} color="#ccc" />
                            <Text style={styles.emptyExamText}>No upcoming exams</Text>
                        </View>
                    )}
                </View>

                {/* Performance Snapshot */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Performance Snapshot</Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/(tabs)/exam')}>
                            <Text style={styles.viewMore}>See All History</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Avg. Score</Text>
                            <Text style={styles.statValue}>{performance?.overallStats.averageScore || 0}</Text>
                            <View style={[styles.statBadge, { backgroundColor: '#eef6ff' }]}>
                                <Text style={[styles.statBadgeText, { color: '#007AFF' }]}>Overall</Text>
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Last Score</Text>
                            <Text style={styles.statValue}>{performance?.overallStats.lastExamScore ?? '-'}</Text>
                            <View style={[styles.statBadge, { backgroundColor: '#f0fdf4' }]}>
                                <Text style={[styles.statBadgeText, { color: '#16a34a' }]}>Recent</Text>
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Exams</Text>
                            <Text style={styles.statValue}>{performance?.overallStats.totalExamsSubmitted || 0}</Text>
                            <View style={[styles.statBadge, { backgroundColor: '#fff7ed' }]}>
                                <Text style={[styles.statBadgeText, { color: '#c2410c' }]}>Completed</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 32,
        marginTop: 20,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    studentName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginTop: 4,
    },
    academyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eef6ff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    academyName: {
        fontSize: 13,
        color: '#007AFF',
        fontWeight: '600',
        marginLeft: 6,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    viewMore: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    nextExamCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#eef2f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    nextExamHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    liveIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#34c759',
        marginRight: 6,
    },
    nextExamStatus: {
        fontSize: 13,
        fontWeight: '700',
        color: '#007AFF',
    },
    nextExamTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    nextExamFooter: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    metaText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
        fontWeight: '500',
    },
    startButton: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    emptyExamCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#eef2f6',
    },
    emptyExamText: {
        fontSize: 15,
        color: '#999',
        marginTop: 12,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        width: '31%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eef2f6',
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    statBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
});
