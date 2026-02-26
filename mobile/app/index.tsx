/**
 * Academy Select Screen
 * 
 * First screen - student selects their academy.
 * Fetches academy details from API: GET /api/academy/:slug
 */

import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { apiClient } from '../services/api';

interface AcademyDetails {
    name: string;
    logoUrl: string | null;
    description: string | null;
}

export default function AcademySelect() {
    const router = useRouter();
    const [academySlug, setAcademySlug] = useState('');
    const [academyDetails, setAcademyDetails] = useState<AcademyDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAcademyDetails = async (slug: string) => {
        if (!slug.trim()) {
            setError('Please enter an academy code');
            return;
        }

        setLoading(true);
        setError(null);
        setAcademyDetails(null);

        const response = await apiClient.get(`/academy/${slug.trim()}`);

        if (response.success && response.data) {
            const data = response.data as any;
            setAcademyDetails({
                name: data.academy.name,
                logoUrl: data.academy.logoUrl,
                description: data.academy.description,
            });
            setError(null);
        } else {
            setError(response.error?.message || 'Academy not found');
            setAcademyDetails(null);
        }

        setLoading(false);
    };

    const handleContinue = () => {
        if (!academyDetails) {
            Alert.alert('Error', 'Please verify academy details first');
            return;
        }

        // Navigate to login with academy slug and name
        router.push({
            pathname: '/login',
            params: {
                academySlug: academySlug.trim(),
                academyName: academyDetails.name
            }
        });
    };

    const handleVerify = () => {
        fetchAcademyDetails(academySlug);
    };

    const handleQuickSelect = (slug: string) => {
        setAcademySlug(slug);
        fetchAcademyDetails(slug);
    };

    return (
        <ScrollView style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.content}>
                <Text style={styles.title}>Welcome to Edu Maths</Text>
                <Text style={styles.subtitle}>Select your academy to continue</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Academy Code</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter academy code"
                        value={academySlug}
                        onChangeText={(text) => {
                            setAcademySlug(text);
                            setError(null);
                            setAcademyDetails(null);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.verifyButton, loading && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={loading || !academySlug.trim()}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#fff" />
                            <Text style={styles.buttonText}>  Verifying...</Text>
                        </View>
                    ) : (
                        <Text style={styles.buttonText}>Verify Academy</Text>
                    )}
                </TouchableOpacity>

                {/* Error Message */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>❌ {error}</Text>
                    </View>
                )}

                {/* Academy Details Card */}
                {academyDetails && (
                    <View style={styles.academyCard}>
                        <View style={styles.academyHeader}>
                            {academyDetails.logoUrl ? (
                                <Image
                                    source={{ uri: academyDetails.logoUrl }}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View style={styles.logoPlaceholder}>
                                    <Text style={styles.logoPlaceholderText}>
                                        {academyDetails.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.academyInfo}>
                                <Text style={styles.academyName}>{academyDetails.name}</Text>
                                <Text style={styles.academySlug}>@{academySlug}</Text>
                            </View>
                        </View>

                        {academyDetails.description && (
                            <View style={styles.descriptionContainer}>
                                <Text style={styles.descriptionLabel}>About:</Text>
                                <Text style={styles.description}>{academyDetails.description}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                        >
                            <Text style={styles.continueButtonText}>Continue to Login →</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Quick select for testing
                {!academyDetails && !loading && (
                    <View style={styles.quickSelect}>
                        <Text style={styles.quickSelectLabel}>Quick Select (Testing):</Text>
                        <TouchableOpacity
                            style={styles.quickButton}
                            onPress={() => handleQuickSelect('aditya-academy')}
                        >
                            <Text style={styles.quickButtonText}>Aditya Academy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickButton}
                            onPress={() => handleQuickSelect('demo-academy')}
                        >
                            <Text style={styles.quickButtonText}>Demo Academy</Text>
                        </TouchableOpacity>
                    </View>
                )} */}

                {/* API Info
                <View style={styles.apiInfo}>
                    <Text style={styles.apiInfoText}> */}
                        {/* API: GET /api/academy/:slug */}
                    {/* </Text>
                </View> */}
            </View>
        </ScrollView>
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
        paddingTop: 60,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
    },
    verifyButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
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
    errorContainer: {
        backgroundColor: '#ffebee',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#ef5350',
    },
    errorText: {
        color: '#c62828',
        fontSize: 14,
        textAlign: 'center',
    },
    academyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    academyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    logoPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    logoPlaceholderText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    academyInfo: {
        flex: 1,
    },
    academyName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    academySlug: {
        fontSize: 14,
        color: '#666',
    },
    descriptionContainer: {
        marginBottom: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    descriptionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    continueButton: {
        backgroundColor: '#34c759',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    quickSelect: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 16,
    },
    quickSelectLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    quickButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    quickButtonText: {
        fontSize: 14,
        color: '#007AFF',
        textAlign: 'center',
    },
    apiInfo: {
        padding: 12,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
    },
    apiInfoText: {
        fontSize: 12,
        color: '#1976d2',
        textAlign: 'center',
    },
});
