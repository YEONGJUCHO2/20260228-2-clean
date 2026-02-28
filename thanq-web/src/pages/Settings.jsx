import { useState, useRef } from 'react';
import { getStats, getSettings, updateSettings, exportAllData, importData, resetAllData } from '../utils/storage';
import './Settings.css';

export default function Settings() {
    const [isPro, setIsPro] = useState(false);
    const [settings, setSettings] = useState(getSettings());
    const [toast, setToast] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const fileInputRef = useRef(null);
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

    // 알림 토글
    const toggleNotif = (key) => {
        const notifs = { ...settings.notifications, [key]: !settings.notifications[key] };
        const next = updateSettings({ notifications: notifs });
        setSettings(next);
        showToast(notifs[key] ? `🔔 ${key === 'daily' ? '매일 알림' : key === 'mission' ? '미션 알림' : '주간 리포트'} 켜짐` : `🔕 알림 꺼짐`);
    };

    // 데이터 백업 (JSON 다운로드)
    const handleBackup = () => {
        exportAllData();
        showToast('☁️ 백업 파일이 다운로드되었습니다');
    };

    // 데이터 내보내기 (CSV-style)
    const handleExportCSV = () => {
        const items = JSON.parse(localStorage.getItem('thanq_items') || '[]');
        if (items.length === 0) {
            showToast('📤 내보낼 데이터가 없습니다');
            return;
        }
        let csv = '이름,카테고리,상태,날짜\n';
        items.forEach(i => {
            csv += `${i.name},${i.category},${i.status === 'farewell' ? '보냄' : '보류'},${i.createdAt?.slice(0, 10) || ''}\n`;
        });
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thanq_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📤 CSV 파일이 다운로드되었습니다');
    };

    // 데이터 복원
    const handleRestore = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const ok = importData(ev.target.result);
            showToast(ok ? '✅ 데이터가 복원되었습니다. 새로고침합니다...' : '❌ 파일 형식이 올바르지 않습니다');
            if (ok) setTimeout(() => window.location.reload(), 1500);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // 전체 초기화
    const handleReset = () => {
        resetAllData();
        showToast('🗑️ 모든 데이터가 초기화되었습니다. 새로고침합니다...');
        setShowResetConfirm(false);
        setTimeout(() => window.location.reload(), 1500);
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
                    <span>🐱</span>
                </div>
                <div className="profile-info">
                    <p className="profile-name">ThanQ 사용자</p>
                    <p className="profile-plan">{isPro ? '🌟 ThanQ Pro 멤버' : '무료 플랜'}</p>
                </div>
                <div className="profile-stat">
                    <span className="profile-count">{stats.total}</span>
                    <span className="profile-label">보내준 물건</span>
                </div>
            </div>

            {/* ThanQ Pro 구독 */}
            {!isPro && (
                <div className="pro-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="pro-header">
                        <h2 className="pro-title">✨ ThanQ Pro</h2>
                        <p className="pro-subtitle">정리의 모든 것을 프로처럼</p>
                    </div>
                    <div className="pro-features">
                        <div className="pro-feature">
                            <span className="pro-icon">💬</span>
                            <div>
                                <p className="feature-title">무제한 AI 대화</p>
                                <p className="feature-desc">스미스와 횟수 제한 없이 대화하세요</p>
                            </div>
                        </div>
                        <div className="pro-feature">
                            <span className="pro-icon">🎨</span>
                            <div>
                                <p className="feature-title">프리미엄 작별 테마</p>
                                <p className="feature-desc">🔥 불꽃놀이, 🦋 나비, 🌌 오로라</p>
                            </div>
                        </div>
                        <div className="pro-feature">
                            <span className="pro-icon">📊</span>
                            <div>
                                <p className="feature-title">월간 정리 리포트</p>
                                <p className="feature-desc">상세 분석과 맞춤 추천을 받아보세요</p>
                            </div>
                        </div>
                        <div className="pro-feature">
                            <span className="pro-icon">📦</span>
                            <div>
                                <p className="feature-title">위시리스트 커스텀</p>
                                <p className="feature-desc">알림 주기와 메모를 자유롭게</p>
                            </div>
                        </div>
                    </div>
                    <div className="pro-pricing">
                        <div className="price-tag">
                            <span className="price-amount">$4.99</span>
                            <span className="price-period">/월</span>
                        </div>
                        <button className="pro-subscribe-btn" onClick={() => setIsPro(true)}>
                            Pro 시작하기
                        </button>
                        <p className="pro-trial">7일 무료 체험 · 언제든 취소 가능</p>
                    </div>
                </div>
            )}

            {isPro && (
                <div className="pro-active-card card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <span className="pro-active-icon">🌟</span>
                    <p className="pro-active-title">ThanQ Pro 활성화됨</p>
                    <p className="pro-active-sub">모든 프리미엄 기능을 사용할 수 있어요!</p>
                </div>
            )}

            {/* 일반 설정 */}
            <div className="settings-menu animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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

                {/* 알림 설정 */}
                <div className="menu-group">
                    <h3 className="menu-title">🔔 알림</h3>

                    <button className="menu-item" onClick={() => toggleNotif('daily')}>
                        <span>📅</span>
                        <span className="menu-item-label">매일 정리 리마인더</span>
                        <div className={`toggle-switch ${settings.notifications.daily ? 'on' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </button>

                    <button className="menu-item" onClick={() => toggleNotif('mission')}>
                        <span>🎯</span>
                        <span className="menu-item-label">미션 달성 알림</span>
                        <div className={`toggle-switch ${settings.notifications.mission ? 'on' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </button>

                    <button className="menu-item" onClick={() => toggleNotif('weekly')}>
                        <span>📊</span>
                        <span className="menu-item-label">주간 리포트</span>
                        <div className={`toggle-switch ${settings.notifications.weekly ? 'on' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </button>
                </div>

                {/* 데이터 관리 */}
                <div className="menu-group">
                    <h3 className="menu-title">데이터</h3>

                    <button className="menu-item" onClick={handleBackup}>
                        <span>☁️</span>
                        <span className="menu-item-label">데이터 백업 (JSON)</span>
                        <span className="menu-arrow">↓</span>
                    </button>

                    <button className="menu-item" onClick={handleExportCSV}>
                        <span>📤</span>
                        <span className="menu-item-label">데이터 내보내기 (CSV)</span>
                        <span className="menu-arrow">↓</span>
                    </button>

                    <button className="menu-item" onClick={() => fileInputRef.current?.click()}>
                        <span>📥</span>
                        <span className="menu-item-label">백업에서 복원</span>
                        <span className="menu-arrow">↑</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleRestore}
                    />

                    <button className="menu-item danger" onClick={() => setShowResetConfirm(true)}>
                        <span>🗑️</span>
                        <span className="menu-item-label">전체 데이터 초기화</span>
                        <span className="menu-arrow">⚠️</span>
                    </button>
                </div>

                {/* 지원 */}
                <div className="menu-group">
                    <h3 className="menu-title">지원</h3>

                    <button className="menu-item" onClick={() => setShowHelp(!showHelp)}>
                        <span>❓</span>
                        <span className="menu-item-label">도움말</span>
                        <span className="menu-arrow">{showHelp ? '▼' : '›'}</span>
                    </button>

                    {showHelp && (
                        <div className="help-panel animate-scale-in">
                            <div className="help-item">
                                <strong>📸 물건 촬영</strong>
                                <p>홈에서 카메라 버튼을 눌러 물건 이름을 입력하고 스미스와 대화하세요.</p>
                            </div>
                            <div className="help-item">
                                <strong>🎯 미션</strong>
                                <p>AI 추천 미션 또는 직접 미션을 설정하세요. 홈에서 '직접 추가' 버튼을 누르면 됩니다.</p>
                            </div>
                            <div className="help-item">
                                <strong>📦 보관함</strong>
                                <p>보내준 물건은 '추억 보관함'에, 보류한 물건은 '위시리스트'에 저장됩니다.</p>
                            </div>
                            <div className="help-item">
                                <strong>☁️ 백업</strong>
                                <p>데이터는 기기에 저장됩니다. 설정에서 JSON 백업 후 다른 기기에서 복원하세요.</p>
                            </div>
                        </div>
                    )}

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
                </div>
            </div>

            {/* 초기화 확인 모달 */}
            {showResetConfirm && (
                <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
                    <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()}>
                        <span className="modal-icon">⚠️</span>
                        <h3>전체 데이터 초기화</h3>
                        <p>모든 물건, 미션, 뱃지, 설정이 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.</p>
                        <div className="modal-btns">
                            <button className="modal-btn cancel" onClick={() => setShowResetConfirm(false)}>취소</button>
                            <button className="modal-btn danger" onClick={handleReset}>초기화</button>
                        </div>
                    </div>
                </div>
            )}

            <p className="version-text">ThanQ v1.0.0 · Made with 🐱</p>
        </div>
    );
}
