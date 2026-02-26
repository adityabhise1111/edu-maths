/**
 * Secure Storage Service
 * 
 * Manages secure storage of authentication tokens and user data.
 * Uses AsyncStorage for persistent storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    AUTH_TOKEN: '@edu_maths_auth_token',
    STUDENT_DATA: '@edu_maths_student_data',
};

/**
 * Store authentication token
 */
export const storeAuthToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        // console.log('✅ Token stored securely');
    } catch (error) {
        // console.error('❌ Error storing token:', error);
        throw error;
    }
};

/**
 * Get authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
    try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return token;
    } catch (error) {
        // console.error('❌ Error retrieving token:', error);
        return null;
    }
};

/**
 * Remove authentication token
 */
export const removeAuthToken = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        // console.log('✅ Token removed');
    } catch (error) {
        // console.error('❌ Error removing token:', error);
        throw error;
    }
};

/**
 * Store student data
 */
export const storeStudentData = async (student: any): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_DATA, JSON.stringify(student));
        // console.log('✅ Student data stored');
    } catch (error) {
        // console.error('❌ Error storing student data:', error);
        throw error;
    }
};

/**
 * Get student data
 */
export const getStudentData = async (): Promise<any | null> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_DATA);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        // console.error('❌ Error retrieving student data:', error);
        return null;
    }
};

/**
 * Remove student data
 */
export const removeStudentData = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.STUDENT_DATA);
        // console.log('✅ Student data removed');
    } catch (error) {
        // console.error('❌ Error removing student data:', error);
        throw error;
    }
};

/**
 * Clear all stored data (logout)
 */
export const clearAllData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.STUDENT_DATA,
        ]);
        // console.log('✅ All data cleared');
    } catch (error) {
        // console.error('❌ Error clearing data:', error);
        throw error;
    }
};
