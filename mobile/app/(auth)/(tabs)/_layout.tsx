import { Tabs } from 'expo-router';
import { TouchableOpacity, Alert, View, Modal, Animated, StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../store/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function TabsLayout() {
    const { logout, student } = useAuth();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-300)).current;

    const openDrawer = () => {
        setIsDrawerOpen(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const closeDrawer = () => {
        Animated.timing(slideAnim, {
            toValue: -300,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            setIsDrawerOpen(false);
        });
    };

    const handleLogout = async () => {
        closeDrawer();
        await logout();
    };

    const handleAccountPress = () => {
        openDrawer();
    };

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: '#007AFF',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={handleAccountPress}
                            style={{ marginRight: 16, padding: 4 }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="person-circle-outline" size={28} color="#fff" />
                        </TouchableOpacity>
                    ),
                    tabBarActiveTintColor: '#007AFF',
                    tabBarInactiveTintColor: '#666',
                    tabBarStyle: {
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderTopColor: '#ddd',
                        height: 60,
                        paddingBottom: 8,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        tabBarLabel: 'Home',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="exam"
                    options={{
                        title: 'Exams',
                        tabBarLabel: 'Exams',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="document-text-outline" size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>

            {/* Side Drawer Modal */}
            <Modal
                visible={isDrawerOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={closeDrawer}
            >
                <Pressable
                    style={styles.overlay}
                    onPress={closeDrawer}
                />

                <Animated.View
                    style={[
                        styles.drawer,
                        {
                            transform: [{ translateX: slideAnim }],
                        },
                    ]}
                >
                    {/* Close Button */}
                    <TouchableOpacity
                        onPress={closeDrawer}
                        style={styles.closeButton}
                    >
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>

                    {/* User Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.profileIcon}>
                            <Ionicons name="person-circle" size={64} color="#007AFF" />
                        </View>

                        <Text style={styles.userName}>{student?.username || 'Student'}</Text>
                        <Text style={styles.academyName}>{student?.academyName || 'Academy'}</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Menu Options */}
                    <ScrollView style={styles.menuSection}>
                        {/* Logout Button */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                            <Text style={styles.menuItemText}>Logout</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 300,
        height: '100%',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 2,
            height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 5,
    },
    closeButton: {
        padding: 16,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    profileSection: {
        paddingHorizontal: 20,
        paddingVertical: 24,
        alignItems: 'center',
    },
    profileIcon: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    academyName: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 20,
    },
    menuSection: {
        flex: 1,
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginTop: 8,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    menuItemText: {
        marginLeft: 16,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
});
