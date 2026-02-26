import { Slot, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, AppState, AppStateStatus, StyleSheet, Alert } from 'react-native';
import { AuthProvider, useAuth } from '../store/AuthContext';
import { useEffect, useRef } from 'react';
import { examSessionManager } from '../store/examSession';
import { setUnauthorizedCallback, setForbiddenCallback } from '../services/api';

function NavigationContent() {
    const { isAuthenticated, isLoading, logout } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const appState = useRef(AppState.currentState);

    const isLoggingOut = useRef(false);

    useEffect(() => {
        // Centralized Error Handling
        setUnauthorizedCallback(() => {
            if (isLoggingOut.current) return;
            isLoggingOut.current = true;

            Alert.alert(
                'Session Expired',
                'Your session has expired. Please login again for security.',
                [{
                    text: 'OK', onPress: () => {
                        logout().finally(() => {
                            isLoggingOut.current = false;
                        });
                    }
                }]
            );
        });

        setForbiddenCallback(() => {
            router.replace('/(auth)/(tabs)/exam');
        });

        return () => {
            setUnauthorizedCallback(null);
            setForbiddenCallback(null);
        };
    }, [logout, router]);

    const checkExamSession = async (forceRedirect = false) => {
        if (!isAuthenticated) return false;

        try {
            const session = await examSessionManager.init();

            // Priority: If any exam session exists, we must handle it (recovery)
            if (session && session.examId) {
                const currentRoute = segments.join('/');
                const isExamRoute = currentRoute.includes('exam-gate') ||
                    currentRoute.includes('exam-taking') ||
                    currentRoute.includes('result');

                // Divert to Gate to resolve session state (Live, Expired, or Submitted)
                if (!isExamRoute || forceRedirect) {
                    // console.log('🔄 Session Recovery: Diverting to ExamGate for resolution...', session.examStatus);
                    router.replace({
                        pathname: '/(auth)/exam-gate',
                        params: { examId: session.examId }
                    });
                    return true;
                }
            }
        } catch (error) {
            // console.error('❌ Corrupted exam session detected, clearing...', error);
            await examSessionManager.clearSession();
        }
        return false;
    };

    // 1. Initial Load / Auth Change Recovery
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && inAuthGroup) {
            router.replace('/');
        } else if (isAuthenticated && !inAuthGroup) {
            checkExamSession(true).then(isRedirecting => {
                if (!isRedirecting) {
                    router.replace('/(auth)/(tabs)/home');
                }
            });
        }
    }, [isAuthenticated, isLoading]);

    // 2. Foreground / Resume Recovery
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // console.log('📱 App has come to the foreground, checking session...');
                checkExamSession();
            }
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [isAuthenticated, segments]);

    // Show nothing while checking session
    if (isLoading) {
        return null;
    }

    return <Slot />;
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={styles.container}>
            <AuthProvider>
                <NavigationContent />
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
