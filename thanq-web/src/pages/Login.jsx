import { useNavigate } from 'react-router-dom';
import {
    signInWithGoogle,
    signInGuest
} from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function Login() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);

    useEffect(() => {
        // 인앱 브라우저 체크
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.match(/kakaotalk|instagram|naver|line|trill/i)) {
            setIsInAppBrowser(true);
            // 안드로이드 카카오톡인 경우 외부 브라우저 호출 시도
            if (userAgent.match(/android/i) && userAgent.match(/kakaotalk/i)) {
                window.location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(window.location.href);
            }
        }
    }, []);

    // 로그인 완료 감지 시 홈으로 이동 (비동기 타이밍 문제 해결의 핵심 요소)
    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const result = await signInWithGoogle();
        // 내부 navigate 삭제 -> useEffect가 처리
        if (!result.success) {
            alert('구글 로그인 실패: ' + result.error);
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setIsLoading(true);
        sessionStorage.setItem('guest_active', 'true'); // 로그인 시도 전 미리 설정하여 AuthContext에서의 강제 로그아웃 방지
        const result = await signInGuest();
        if (!result.success) {
            sessionStorage.removeItem('guest_active');
            alert('게스트 로그인 실패: ' + result.error);
            setIsLoading(false);
        }
        // 버튼을 누른 후 navigate 호출부를 삭제하여 레이스 컨디션 차단
    };

    const btnStyle = {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        width: '100%', padding: '14px 24px', borderRadius: '12px',
        marginBottom: '12px',
        border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)',
        color: 'var(--text-color)', fontSize: '1rem', fontWeight: 'bold',
        cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
    };

    return (
        <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
            <div className="animate-fade-in-up" style={{ textAlign: 'center', padding: '20px', width: '100%', maxWidth: '360px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</div>
                <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--primary-color)' }}>ThanQ</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '40px' }}>물건을 비우고 마음을 채우는 시간</p>

                {isLoading ? (
                    <div style={{ padding: '20px' }}><p>작업 처리 중입니다...</p></div>
                ) : (
                    <>
                        {isInAppBrowser && (
                            <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', textAlign: 'left', border: '1px solid #ffeeba', lineHeight: '1.4' }}>
                                ⚠️ <strong>인앱 브라우저 접속 안내</strong><br />
                                현재 앱(카카오톡, 인스타 등)에서는 구글 보안 정책상 로그인이 차단될 수 있습니다.<br />
                                화면 하단(또는 상단)의 <strong>[점 3개] 메뉴(⋮/⠇)</strong>를 눌러 <strong>[다른 브라우저로 열기]</strong> 혹은 <strong>[Safari/Chrome으로 열기]</strong>를 선택해 주세요!
                            </div>
                        )}

                        <button
                            onClick={handleGuestLogin}
                            style={{ ...btnStyle, backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '1.2rem' }}>⚡</span>
                            로그인 없이 바로 시작하기
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-muted)' }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                            <span style={{ margin: '0 10px', fontSize: '0.85rem' }}>또는 다음으로 로그인</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            style={btnStyle}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" style={{ width: '20px', height: '20px' }} />
                            Google 계정으로 계속
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
