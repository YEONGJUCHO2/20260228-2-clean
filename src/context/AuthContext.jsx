import React, { createContext, useContext, useEffect, useState } from 'react';
import { migrateLocalToCloud } from '../utils/cloudStorage';
import { auth, onAuthStateChanged, signInGuest, db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Firestore에서 Pro 구독 상태를 확인하는 함수
async function checkProStatus(user) {
    if (!user || user.isAnonymous) return false;
    try {
        const subDoc = await getDoc(doc(db, 'users', user.uid, 'subscription', 'info'));
        if (subDoc.exists() && subDoc.data().isPro === true) {
            return true;
        }
        return false;
    } catch (e) {
        console.warn('Pro 상태 확인 실패:', e);
        return false;
    }
}

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isPro, setIsPro] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // 인증된 유저가 없으면 즉시 익명(게스트) 로그인 처리
                signInGuest().catch((err) => {
                    console.error('게스트 로그인 실패:', err);
                    setLoading(false); // 실패해도 로딩 해제 (무한 로딩 방지)
                });
                return;
            }

            // 일반/Pro 유저 로그인 시 localStorage → Firestore 마이그레이션
            if (user && !user.isAnonymous) {
                migrateLocalToCloud(user).catch(console.warn);
            }

            // Firestore에서 Pro 구독 상태 확인 (서버 검증)
            const proStatus = await checkProStatus(user);
            setIsPro(proStatus);

            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const logout = () => {
        sessionStorage.removeItem('guest_active');
        setIsPro(false);
        return auth.signOut();
    };

    // Pro 결제 완료 후 상태 갱신용
    const refreshProStatus = async () => {
        if (currentUser && !currentUser.isAnonymous) {
            const proStatus = await checkProStatus(currentUser);
            setIsPro(proStatus);
        }
    };

    const value = {
        currentUser,
        isPro,
        refreshProStatus,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
