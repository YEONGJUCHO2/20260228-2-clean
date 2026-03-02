export const CATEGORIES = {
    electronics: { id: 'electronics', name: '전자기기', icon: '📱', color: '#5ABAB7' },
    clothing: { id: 'clothing', name: '의류', icon: '👕', color: '#E8836B' },
    clothes: { id: 'clothing', name: '의류', icon: '👕', color: '#E8836B' },
    cards: { id: 'cards', name: '카드', icon: '💳', color: '#E8836B' },
    books: { id: 'books', name: '책', icon: '📚', color: '#7BA7CC' },
    accessories: { id: 'accessories', name: '소품', icon: '🧸', color: '#D4A853' },
    memories: { id: 'memories', name: '추억', icon: '💌', color: '#C084FC' },
    memory: { id: 'memories', name: '추억', icon: '💌', color: '#C084FC' },
    kitchen: { id: 'kitchen', name: '주방용품', icon: '🍳', color: '#F59E0B' },
    other: { id: 'other', name: '기타', icon: '📦', color: '#A09890' }
};

export const getCategoryInfo = (cat) => {
    if (!cat) return CATEGORIES.other;
    const key = cat.toLowerCase();
    return CATEGORIES[key] || CATEGORIES.other;
};

export const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};
