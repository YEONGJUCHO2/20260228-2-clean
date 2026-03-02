// cloudStorage.js - 유저 타입별 통합 스토리지 (Firestore + localStorage)
import {
    collection, doc, getDocs, addDoc, deleteDoc, updateDoc,
    query, orderBy, limit, setDoc, getDoc
} from 'firebase/firestore';
import { db } from './firebase';

// 일반 유저 보관함 최대 개수
export const FREE_USER_ITEM_LIMIT = 10;

// Pro 여부 확인 (Settings localStorage 기반 - 추후 Firestore로 이전)
export function isProUser() {
    const settings = JSON.parse(localStorage.getItem('thanq_settings') || '{}');
    return settings.isPro === true;
}

// 유저 타입 반환: 'guest' | 'free' | 'pro'
export function getUserTier(user) {
    if (!user || user.isAnonymous) return 'guest';
    if (isProUser()) return 'pro';
    return 'free';
}

// ===== Firestore 경로 =====
const userItemsRef = (uid) => collection(db, 'users', uid, 'items');
const userItemRef = (uid, itemId) => doc(db, 'users', uid, 'items', itemId);

// ===== 아이템 조회 =====
export async function getItemsCloud(user) {
    if (!user || user.isAnonymous) {
        // 게스트: sessionStorage에서 읽기
        const data = sessionStorage.getItem('guest_items');
        return data ? JSON.parse(data) : [];
    }
    try {
        const q = query(userItemsRef(user.uid), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error('Firestore 읽기 실패:', e);
        return []; // 실패 시 빈 배열 반환 (폴백 로직 제거)
    }
}

// ===== 랭킹 조회 및 업데이트 =====
export async function getRankingsCloud() {
    try {
        const q = query(collection(db, 'rankings'), orderBy('count', 'desc'), limit(5));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error('랭킹 가져오기 실패:', e);
        return [];
    }
}

export async function updateUserRanking(user) {
    if (!user || user.isAnonymous) return;
    try {
        const items = await getItemsCloud(user);
        // 작별한 물건만 카운트
        const count = items.filter(i => i.status === 'farewell' || !i.status).length;

        await setDoc(doc(db, 'rankings', user.uid), {
            name: user.displayName || 'ThanQ 사용자',
            avatar: user.photoURL || '🐱',
            count: count,
            updatedAt: new Date().toISOString()
        });
    } catch (e) {
        console.warn('랭킹 업데이트 실패:', e);
    }
}

// ===== 아이템 추가 =====
export async function addItemCloud(user, item) {
    const newItem = {
        createdAt: new Date().toISOString(),
        imageData: null, // 이미지는 Storage 미사용 시 null
        ...item,
    };

    if (!user || user.isAnonymous) {
        // 게스트: sessionStorage에 저장 (세션 끝나면 삭제)
        const items = JSON.parse(sessionStorage.getItem('guest_items') || '[]');
        const withId = { ...newItem, id: Date.now().toString() };
        items.unshift(withId);
        sessionStorage.setItem('guest_items', JSON.stringify(items));
        return withId;
    }

    const tier = getUserTier(user);

    // 일반 유저 10개 한도 체크
    if (tier === 'free') {
        const existing = await getItemsCloud(user);
        if (existing.length >= FREE_USER_ITEM_LIMIT) {
            throw new Error(`FREE_LIMIT_REACHED`);
        }
    }

    try {
        const docRef = await addDoc(userItemsRef(user.uid), newItem);
        const savedItem = { id: docRef.id, ...newItem };
        await updateUserRanking(user);
        return savedItem;
    } catch (e) {
        console.error('Firestore 쓰기 실패:', e);
        throw e;
    }
}

// ===== 아이템 삭제 =====
export async function deleteItemCloud(user, itemId) {
    if (!user || user.isAnonymous) {
        const items = JSON.parse(sessionStorage.getItem('guest_items') || '[]')
            .filter(i => String(i.id) !== String(itemId));
        sessionStorage.setItem('guest_items', JSON.stringify(items));
        return;
    }
    try {
        await deleteDoc(userItemRef(user.uid, itemId));
        await updateUserRanking(user);
    } catch (e) {
        console.warn('Firestore 삭제 실패:', e);
    }
}

// ===== 복수 아이템 삭제 =====
export async function deleteItemsCloud(user, itemIds) {
    await Promise.all(itemIds.map(id => deleteItemCloud(user, id)));
}

// ===== 아이템 업데이트 =====
export async function updateItemCloud(user, itemId, updates) {
    if (!user || user.isAnonymous) {
        const items = JSON.parse(sessionStorage.getItem('guest_items') || '[]');
        const idx = items.findIndex(i => String(i.id) === String(itemId));
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...updates };
            sessionStorage.setItem('guest_items', JSON.stringify(items));
            return items[idx];
        }
        return null;
    }
    try {
        await updateDoc(userItemRef(user.uid, itemId), updates);
        await updateUserRanking(user);
        return { id: itemId, ...updates };
    } catch (e) {
        console.warn('Firestore 업데이트 실패:', e);
    }
}

// ===== localStorage에서 Firestore로 마이그레이션 (로그인 시 1회) =====
export async function migrateLocalToCloud(user) {
    if (!user || user.isAnonymous) return;
    const migrated = localStorage.getItem(`thanq_migrated_${user.uid}`);
    if (migrated) return; // 이미 마이그레이션 완료

    const localItems = JSON.parse(localStorage.getItem('thanq_items') || '[]');
    if (localItems.length === 0) {
        localStorage.setItem(`thanq_migrated_${user.uid}`, 'true');
        return;
    }

    const tier = getUserTier(user);
    const itemsToMigrate = tier === 'pro' ? localItems : localItems.slice(0, FREE_USER_ITEM_LIMIT);

    try {
        for (const item of itemsToMigrate) {
            const { id, ...rest } = item;
            await setDoc(doc(db, 'users', user.uid, 'items', id), rest);
        }
        localStorage.setItem(`thanq_migrated_${user.uid}`, 'true');
        console.log(`✅ ${itemsToMigrate.length}개 아이템 클라우드로 마이그레이션 완료`);
        await updateUserRanking(user);
    } catch (e) {
        console.warn('마이그레이션 실패:', e);
    }
}

// ===== 현재 아이템 수 + 한도 정보 =====
export async function getStorageInfo(user) {
    if (!user || user.isAnonymous) {
        const items = JSON.parse(sessionStorage.getItem('guest_items') || '[]');
        return { count: items.length, limit: null, tier: 'guest' };
    }
    const tier = getUserTier(user);
    const items = await getItemsCloud(user);
    return {
        count: items.length,
        limit: tier === 'pro' ? null : FREE_USER_ITEM_LIMIT,
        tier,
    };
}
