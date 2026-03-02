import { useState } from 'react';
import { getStats, getSettings, updateSettings } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../utils/firebase';
import { getItemsCloud } from '../utils/cloudStorage';
import './Settings.css';

export default function Settings() {
    const { currentUser, isPro } = useAuth();
    const [settings, setSettings] = useState(getSettings());
    const [toast, setToast] = useState('');
    const stats = getStats();

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    // 다크모드 토글
    const toggleDarkMode = () => {
        const next = updateSettings({ darkMode: !settings.darkMode });
        setSettings(next);
        showToast(next.darkMode ? '🌙 다크 모드 활성화' : '☀️ 라이트 모드 활성화');
    };

    // 언어 변경
    const cycleLanguage = () => {
        const langs = ['ko', 'en', 'ja'];
        const labels = { ko: '한국어', en: 'English', ja: '日本語' };
        const idx = langs.indexOf(settings.language);
        const nextLang = langs[(idx + 1) % langs.length];
        const next = updateSettings({ language: nextLang });
        setSettings(next);
        showToast(`🌍 언어: ${labels[nextLang]}`);
    };

    // 추억함 내보내기 (이메일 전송 기능)
    const handleExportEmail = async () => {
        const items = await getItemsCloud(currentUser);
        const farewellItems = items.filter(i => i.status === 'farewell' || !i.status);

        if (farewellItems.length === 0) {
            showToast('📤 추억함에 보낸 물건이 없습니다');
            return;
        }

        let body = '내 추억함 리스트:\n\n';
        farewellItems.forEach(i => {
            body += `- ${i.name} (${i.category || '미분류'}) - ${i.createdAt?.slice(0, 10) || ''}\n`;
        });

        const subject = encodeURIComponent('ThanQ 추억함 리스트 내보내기');
        const encodedBody = encodeURIComponent(body);

        // 이메일 앱 열기 (사용자 본인 이메일로 전송)
        const toEmail = currentUser?.email || '';
        window.location.href = `mailto:${toEmail}?subject=${subject}&body=${encodedBody}`;
        showToast('📧 메일 앱이 열립니다');
    };

    const handleLogout = async () => {
        const result = await logoutUser();
        if (!result.success) {
            showToast('로그아웃에 실패했습니다.');
        }
    };

    const langLabel = { ko: '한국어', en: 'English', ja: '日本語' }[settings.language] || '한국어';

    return (
        <div className="page settings-page">
            <h1 className="page-title animate-fade-in">⚙️ 설정</h1>

            {/* 토스트 */}
            {toast && <div className="settings-toast animate-scale-in">{toast}</div>}

            {/* 프로필 */}
            <div className="profile-card card animate-fade-in-up">
                <div className="profile-avatar">
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="profile" className="profile-img" />
                    ) : (
                        <img src="/smith-avatar.png" alt="Smith" className="profile-img" />
                    )}
                </div>
                <div className="profile-info">
                    <p className="profile-name">{currentUser?.displayName || 'ThanQ 사용자'}</p>
                    <p className="profile-plan" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentUser?.email}</p>
                    <p className="profile-plan">{isPro ? '🌟 ThanQ Pro 멤버' : '무료 플랜'}</p>
                </div>
                <div className="profile-stat">
                    <span className="profile-count">{stats.total}</span>
                    <span className="profile-label">보내준 물건</span>
                </div>
            </div>

            {/* 일반 설정 */}
            <div className="settings-menu animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="menu-group">
                    <h3 className="menu-title">일반</h3>

                    {/* 다크모드 토글 */}
                    <button className="menu-item" onClick={toggleDarkMode}>
                        <span>{settings.darkMode ? '☀️' : '🌙'}</span>
                        <span className="menu-item-label">{settings.darkMode ? '라이트 모드' : '다크 모드'}</span>
                        <div className={`toggle-switch ${settings.darkMode ? 'on' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </button>

                    {/* 언어 설정 */}
                    <button className="menu-item" onClick={cycleLanguage}>
                        <span>🌍</span>
                        <span className="menu-item-label">언어 설정</span>
                        <span className="menu-value">{langLabel}</span>
                    </button>
                </div>

                {/* 데이터 관리 */}
                <div className="menu-group">
                    <h3 className="menu-title">데이터</h3>

                    <button className="menu-item" onClick={handleExportEmail}>
                        <span>📤</span>
                        <span className="menu-item-label">추억함 리스트 메일로 내보내기</span>
                        <span className="menu-arrow">›</span>
                    </button>
                </div>

                {/* 지원 */}
                <div className="menu-group">
                    <h3 className="menu-title">지원</h3>

                    <button className="menu-item" onClick={() => { window.open('mailto:support@thanq.app'); showToast('📧 메일 앱이 열립니다'); }}>
                        <span>📧</span>
                        <span className="menu-item-label">문의하기</span>
                        <span className="menu-arrow">›</span>
                    </button>

                    <button className="menu-item" onClick={() => showToast('⭐ 감사합니다! (앱스토어 연동 예정)')}>
                        <span>⭐</span>
                        <span className="menu-item-label">앱 평가하기</span>
                        <span className="menu-arrow">›</span>
                    </button>

                    <button className="menu-item danger" onClick={handleLogout} style={{ marginTop: '10px' }}>
                        <span>👋</span>
                        <span className="menu-item-label">로그아웃</span>
                        <span className="menu-arrow">›</span>
                    </button>
                </div>
            </div>

            <p className="version-text">ThanQ v1.0.0 · Made with 🐱</p>
        </div>
    );
}
