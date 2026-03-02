// ThanQ 유틸리티 - localStorage 기반 데이터 관리

const STORAGE_KEYS = {
    ITEMS: 'thanq_items',
    MISSIONS: 'thanq_missions',
    BADGES: 'thanq_badges',
    STATS: 'thanq_stats',
    QUOTES_INDEX: 'thanq_quote_idx',
    THEME_UNLOCKS: 'thanq_themes',
    USER: 'thanq_user',
    API_LIMITS: 'thanq_api_limits',
};

// === 아이템 관리 ===
export function getItems() {
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return data ? JSON.parse(data) : [];
}

export function addItem(item) {
    const items = getItems();
    const newItem = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        ...item,
    };
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    checkBadges();
    checkThemeUnlocks();
    return newItem;
}

export function updateItem(id, updates) {
    const items = getItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
        items[idx] = { ...items[idx], ...updates };
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    }
    return items[idx];
}

export function deleteItem(id) {
    const strId = String(id);
    const items = getItems().filter(i => String(i.id) !== strId);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
}

export function deleteItems(ids) {
    const idSet = new Set(ids.map(id => String(id)));
    const items = getItems().filter(i => !idSet.has(String(i.id)));
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
}


export function getFarewellItems() {
    return getItems().filter(i => i.status === 'farewell');
}

export function getWishlistItems() {
    return getItems().filter(i => i.status === 'wishlist');
}

// === 미션 관리 (AI 추천 + 사용자 직접 설정 듀얼 방식) ===
const DEFAULT_MISSIONS = [
    { id: 'm1', title: '첫 작별 인사하기', target: 1, category: '전체', source: 'ai' },
    { id: 'm2', title: '의류 3벌 보내주기', target: 3, category: '의류', source: 'ai' },
    { id: 'm3', title: '5일 연속 정리하기', target: 5, category: '전체', source: 'ai' },
];

export function getMissions() {
    const data = localStorage.getItem(STORAGE_KEYS.MISSIONS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(DEFAULT_MISSIONS));
    return DEFAULT_MISSIONS;
}

export function addMission(title, target, category, source) {
    const missions = getMissions();
    const newMission = {
        id: 'u_' + Date.now(),
        title,
        target: parseInt(target) || 1,
        category: category || '전체',
        source: source || 'user',
    };
    missions.push(newMission);
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
    return newMission;
}

export function deleteMission(id) {
    const missions = getMissions().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
    return missions;
}

export function getMissionProgress(mission, customItems = null) {
    const items = customItems || getFarewellItems();
    if (mission.category === '전체') return Math.min(items.length, mission.target);
    return Math.min(items.filter(i => i.category === mission.category).length, mission.target);
}

// === 설정 관리 ===
const SETTINGS_KEY = 'thanq_settings';

export function getSettings() {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
        darkMode: false,
        language: 'ko',
        notifications: { daily: true, mission: true, weekly: false },
    };
}

export function updateSettings(updates) {
    const current = getSettings();
    const next = { ...current, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    // 다크모드 적용
    if (updates.darkMode !== undefined) {
        document.documentElement.setAttribute('data-theme', updates.darkMode ? 'dark' : 'light');
    }
    return next;
}

export function applyThemeOnLoad() {
    const s = getSettings();
    if (s.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// === 데이터 백업/내보내기 ===
export function exportAllData() {
    const data = {
        items: getItems(),
        missions: getMissions(),
        badges: getBadges(),
        settings: getSettings(),
        exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thanq_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function importData(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        if (data.items) localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(data.items));
        if (data.missions) localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(data.missions));
        if (data.badges) localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(data.badges));
        if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
        return true;
    } catch { return false; }
}

export function resetAllData() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem('thanq_quote_date');
}

// === 뱃지 시스템 ===
const BADGE_DEFS = [
    { id: 'first_step', name: '첫 걸음', icon: '🐣', condition: () => getFarewellItems().length >= 1 },
    { id: 'week_champ', name: '일주일 챔피언', icon: '📅', condition: () => false },
    { id: 'decision_master', name: '결심의 달인', icon: '💪', condition: () => getItems().some(i => i.fromWishlist) },
    { id: 'cleanup_master', name: '정리 마스터', icon: '🌟', condition: () => getFarewellItems().length >= 10 },
];

export function getBadges() {
    const data = localStorage.getItem(STORAGE_KEYS.BADGES);
    return data ? JSON.parse(data) : [];
}

export function checkBadges() {
    const earned = getBadges();
    const newBadges = [];
    BADGE_DEFS.forEach(badge => {
        if (!earned.includes(badge.id) && badge.condition()) {
            earned.push(badge.id);
            newBadges.push(badge);
        }
    });
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(earned));
    return newBadges;
}

export function getAllBadgeDefs() {
    return BADGE_DEFS;
}

// === 테마 해금 ===
const THEME_DEFS = [
    { id: 'sparkle', name: '반짝이', icon: '✨', minCount: 0 },
    { id: 'cherry', name: '벚꽃', icon: '🌸', minCount: 5 },
    { id: 'wave', name: '파도', icon: '🌊', minCount: 10 },
    { id: 'shooting_star', name: '별똥별', icon: '⭐', minCount: 20 },
    { id: 'firework', name: '불꽃놀이', icon: '🔥', premium: true },
    { id: 'butterfly', name: '나비', icon: '🦋', premium: true },
    { id: 'aurora', name: '오로라', icon: '🌌', premium: true },
];

export function getUnlockedThemes() {
    const count = getFarewellItems().length;
    return THEME_DEFS.filter(t => !t.premium && count >= t.minCount);
}

export function getAllThemes() {
    return THEME_DEFS;
}

function checkThemeUnlocks() {
    const unlocked = getUnlockedThemes();
    localStorage.setItem(STORAGE_KEYS.THEME_UNLOCKS, JSON.stringify(unlocked.map(t => t.id)));
}

// === 통계 ===
export function getStats() {
    const items = getFarewellItems();
    const categories = {};
    items.forEach(item => {
        const cat = item.category || '기타';
        categories[cat] = (categories[cat] || 0) + 1;
    });

    return {
        total: items.length,
        thisMonth: items.filter(i => {
            const d = new Date(i.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length,
        categories,
        wishlistCount: getWishlistItems().length,
    };
}

// === 명언 ===
const QUOTES = [
    "이 물건이 당신의 이상적인 삶에 아직 자리가 있나요?",
    "설레지 않으면, 감사하며 보내주세요.",
    "물건을 버리는 것이 아니라, 미래의 나에게 공간을 선물하는 거예요.",
    "가장 좋은 정리법은 물건에게 '고마웠어'라고 말하는 거예요.",
    "모든 물건에는 역할이 있고, 그 역할이 끝나면 보내줘도 괜찮아요.",
    "정리는 과거와 화해하고 미래를 맞이하는 의식이에요.",
    "내가 진심으로 좋아하는 것만 남기면, 삶이 빛나기 시작해요.",
    "물건을 통해 나를 알아가는 여정, 오늘도 한 걸음!",
];

export function getDailyQuote() {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('thanq_quote_date');
    if (saved === today) {
        const idx = parseInt(localStorage.getItem(STORAGE_KEYS.QUOTES_INDEX) || '0');
        return QUOTES[idx % QUOTES.length];
    }
    const idx = Math.floor(Math.random() * QUOTES.length);
    localStorage.setItem('thanq_quote_date', today);
    localStorage.setItem(STORAGE_KEYS.QUOTES_INDEX, idx.toString());
    return QUOTES[idx];
}

// === 카테고리 ===
export const CATEGORIES = [
    { id: 'clothing', name: '의류', icon: '👕' },
    { id: 'books', name: '책', icon: '📚' },
    { id: 'electronics', name: '전자기기', icon: '📱' },
    { id: 'accessories', name: '소품', icon: '🧸' },
    { id: 'memories', name: '추억', icon: '💌' },
    { id: 'kitchen', name: '주방용품', icon: '🍳' },
    { id: 'other', name: '기타', icon: '📦' },
];

// === AI 카테고리 자동 추천 ===
const CATEGORY_KEYWORDS = {
    clothing: [
        '옷', '셔츠', '바지', '치마', '원피스', '자켓', '코트', '패딩', '점퍼',
        '운동화', '구두', '슬리퍼', '신발', '부츠', '샌들', '양말', '속옷',
        '모자', '스카프', '머플러', '장갑', '넥타이', '가디건', '니트', '후드',
        '티셔츠', '반팔', '긴팔', '청바지', '레깅스', '수영복', '잠옷',
        '한복', '교복', '유니폼', '조끼', '벨트', '의류', '블라우스', '슈트',
    ],
    books: [
        '책', '소설', '만화', '잡지', '교재', '참고서', '도서', '문고',
        '사전', '백과', '노트', '다이어리', '수첩', '앨범', '도감', '일기',
        '논문', '에세이', '시집', '동화', '그림책', '워크북', '교과서',
    ],
    electronics: [
        '폰', '휴대폰', '스마트폰', '핸드폰', '노트북', '컴퓨터', 'pc', '태블릿',
        '아이패드', '아이폰', '갤럭시', '맥북', '이어폰', '헤드폰', '에어팟',
        '충전기', '케이블', '마우스', '키보드', '모니터', '카메라', '캠코더',
        '스피커', '블루투스', 'usb', '게임기', '플스', '닌텐도', '스위치',
        '시계', '스마트워치', '전자', '리모컨', '프린터', '드론', 'tv', '텔레비전',
    ],
    accessories: [
        '가방', '백팩', '지갑', '파우치', '케이스', '안경', '선글라스',
        '반지', '목걸이', '귀걸이', '팔찌', '브로치', '열쇠고리', '키링',
        '인형', '피규어', '장식', '소품', '쿠션', '방향제', '캔들', '향초',
        '우산', '거울', '빗', '화장품', '향수', '액세서리', '토이', '장난감',
    ],
    memories: [
        '사진', '편지', '엽서', '카드', '선물', '기념', '추억', '졸업',
        '트로피', '상장', '메달', '기념품', '수집품', '수료증', '초대장',
        '웨딩', '돌잔치', '티켓', '입장권', '여행', '우표', '스티커',
    ],
    kitchen: [
        '접시', '그릇', '컵', '머그', '냄비', '프라이팬', '도마', '칼',
        '수저', '젓가락', '포크', '숟가락', '주전자', '텀블러', '보온병',
        '밥솥', '전자레인지', '토스터', '믹서기', '블렌더', '에어프라이어',
        '주방', '식기', '수세미', '행주', '앞치마', '도시락', '보관용기',
    ],
};

export function guessCategory(itemName) {
    if (!itemName) return 'other';
    const name = itemName.toLowerCase().trim();
    let bestMatch = 'other';
    let bestScore = 0;

    for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (name.includes(keyword) && keyword.length > bestScore) {
                bestMatch = catId;
                bestScore = keyword.length; // 더 긴 키워드 매칭이 더 정확
            }
        }
    }
    return bestMatch;
}

// === API 사용량 제한 ===
// isPro: AuthContext에서 받은 서버 검증된 Pro 상태
export function checkApiLimit(user, isPro = false) {
    if (!user) return { allowed: false, reason: "로그인이 필요합니다." };
    const limits = JSON.parse(localStorage.getItem(STORAGE_KEYS.API_LIMITS) || '{}');
    const uid = user.uid;
    const today = new Date().toDateString();

    if (!limits[uid]) {
        limits[uid] = { guest_total: 0, last_date: today, daily_count: 0 };
    }

    if (user.isAnonymous) {
        if (limits[uid].last_date !== today) {
            limits[uid].last_date = today;
            limits[uid].guest_total = 0;
        }
        if (limits[uid].guest_total >= 3) return { allowed: false, reason: "게스트 체험 횟수(하루 3회)를 모두 사용했어요. 로그인하면 더 많이 이용할 수 있어요! 🐱" };
        return { allowed: true };
    } else {
        if (isPro) return { allowed: true }; // Pro 유저는 무제한
        if (limits[uid].last_date !== today) {
            limits[uid].last_date = today;
            limits[uid].daily_count = 0;
        }
        if (limits[uid].daily_count >= 10) return { allowed: false, reason: "오늘의 무료 분석 횟수(10회)를 모두 사용했어요.\n🌟 ThanQ Pro로 무제한 분석을 즐겨보세요!" };
        return { allowed: true };
    }
}

export function incrementApiUsage(user) {
    if (!user) return;
    const limits = JSON.parse(localStorage.getItem(STORAGE_KEYS.API_LIMITS) || '{}');
    const uid = user.uid;
    const today = new Date().toDateString();

    if (!limits[uid]) {
        limits[uid] = { guest_total: 0, last_date: today, daily_count: 0 };
    }

    if (user.isAnonymous) {
        if (limits[uid].last_date !== today) {
            limits[uid].last_date = today;
            limits[uid].guest_total = 0;
        }
        limits[uid].guest_total += 1;
    } else {
        if (limits[uid].last_date !== today) {
            limits[uid].last_date = today;
            limits[uid].daily_count = 0;
        }
        limits[uid].daily_count += 1;
    }
    localStorage.setItem(STORAGE_KEYS.API_LIMITS, JSON.stringify(limits));
}

// === Mock 랭킹 데이터 ===
export function getRankings() {
    const myCount = getFarewellItems().length;
    return [
        { rank: 1, name: '정리왕 미나', count: 23, avatar: '👸' },
        { rank: 2, name: '보내주기달인', count: 18, avatar: '🧑‍🎨' },
        { rank: 3, name: '나', count: myCount, avatar: '🐱', isMe: true },
        { rank: 4, name: '깔끔러버', count: Math.max(myCount - 2, 0), avatar: '🧹' },
        { rank: 5, name: '미니멀리스트', count: Math.max(myCount - 5, 0), avatar: '🏠' },
    ].sort((a, b) => b.count - a.count).map((r, i) => ({ ...r, rank: i + 1 }));
}
