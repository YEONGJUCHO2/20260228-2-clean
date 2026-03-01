import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged } from '../utils/firebase';
import { migrateLocalToCloud } from '../utils/cloudStorage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            // 게스트(익명) 사용자는 앱 새로 열 때마다 로그인 화면을 보여주기 위해 자동 로그아웃
            if (user && user.isAnonymous && !sessionStorage.getItem('guest_active')) {
                auth.signOut().then(() => {
                    setCurrentUser(null);
                    setLoading(false);
                });
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
