/**
 * Student Login Screen
 * 
 * Login screen for students after selecting academy.
 * Connects to API: POST /api/students/login
 */

import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { apiClient } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function StudentLogin() {
    const router = useRouter();
    const { academySlug } = useLocalSearchParams<{ academySlug: string }>();
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Basic validation
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        if (!academySlug) {
            Alert.alert('Error', 'Academy not selected');
            return;
        }

        setLoading(true);

        try {
            // Call login API
            const response = await apiClient.post('/students/login', {
                academySlug: academySlug,
                username: username.trim(),
                password: password.trim(),
            });

            if (response.success && response.data) {
                // Extract data from response
                const responseData = response.data as any; // API response type
                const { token, student } = responseData;

                // Login with auth context
                await login(
                    {
                        id: student.id,
                        username: student.username,
                        academyId: student.academyId,
                        academyName: student.academyName,
                        academySlug: academySlug || '',  // Store academy slug
                    },
                    token
                );

                // Navigation will happen automatically via AuthContext
            } else {
                // Show error from API
                Alert.alert(
                    'Login Failed',
                    response.error?.message || 'Invalid credentials'
                );
            }
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'Failed to connect to server'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    disabled={loading}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Student Login</Text>
                <Text style={styles.subtitle}>
                    Academy: {academySlug || 'Not selected'}
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Username</Text>
                        <View style={styles.userName}>
                            <TextInput
                            style={styles.input}
                            placeholder="Enter your username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="#fff" />
                                <Text style={styles.buttonText}>  Logging in...</Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>Login</Text>
                        )}
                    </TouchableOpacity>
                </View>

                API info
                {/* <View style={styles.apiInfo}>
                    <Text style={styles.apiInfoLabel}>API Integration</Text>
                    <Text style={styles.apiInfoText}>
                        POST /api/students/login
                    </Text>
                    <Text style={styles.apiInfoText}>
                        ✅ Connected to backend
                    </Text>
                </View> */}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 24,
        zIndex: 1,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    form: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eyeIcon: {
        position: 'absolute',
        right: 12,
        padding: 8,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    apiInfo: {
        padding: 16,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4caf50',
    },
    apiInfoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2e7d32',
        marginBottom: 8,
    },
    apiInfoText: {
        fontSize: 12,
        color: '#2e7d32',
        textAlign: 'center',
    },
});
