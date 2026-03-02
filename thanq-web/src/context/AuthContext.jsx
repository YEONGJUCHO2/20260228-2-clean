import React, { createContext, useContext, useEffect, useState } from 'react';
import { migrateLocalToCloud } from '../utils/cloudStorage';
import { auth, onAuthStateChanged, signInGuest } from '../utils/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // 인증된 유저가 없으면 즉시 익명(게스트) 로그인 처리
                signInGuest().catch(console.error);
                return;
            }

            // 일반/Pro 유저 로그인 시 localStorage → Firestore 마이그레이션
            if (user && !user.isAnonymous) {
                migrateLocalToCloud(user).catch(console.warn);
            }

            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const logout = () => {
        sessionStorage.removeItem('guest_active');
        return auth.signOut();
    };

    const value = {
        currentUser,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
