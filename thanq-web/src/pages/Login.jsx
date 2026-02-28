import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInGuest } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function Login() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // 이미 로그인된 경우 메인으로 이동
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const result = await signInWithGoogle();
        if (result.success) {
            navigate('/');
        } else {
            alert('구글 로그인에 실패했습니다. 다시 시도해주세요.');
            setIsLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setIsLoading(true);
        const result = await signInGuest();
        if (result.success) {
            navigate('/');
        } else {
            alert('게스트 로그인에 실패했습니다. 다시 시도해주세요.');
            setIsLoading(false);
        }
    };

    const handleNotImplemented = (provider) => {
        alert(`${provider} 로그인은 현재 준비 중입니다. 먼저 게스트나 구글 계정으로 시작해보세요!`);
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
                    <div style={{ padding: '20px' }}><p>로그인 중입니다...</p></div>
                ) : (
                    <>
                        {/* 1. 추천: 1초 만에 시작하는 게스트 로그인 */}
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

                        {/* 2. 구글 로그인 */}
                        <button
                            onClick={handleGoogleLogin}
                            style={btnStyle}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" style={{ width: '20px', height: '20px' }} />
                            Google 계정으로 계속
                        </button>

                        {/* 3. 애플 로그인 (구현 예정) */}
                        <button
                            onClick={() => handleNotImplemented('Apple')}
                            style={{ ...btnStyle, backgroundColor: 'var(--text-color)', color: 'var(--bg-color)' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '20px', display: 'flex', alignItems: 'center' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="16" height="16" fill="currentColor">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 24 184.6 24 252.6c0 40 18.2 101.4 53.6 153.3 19.3 28.5 45.9 61.4 76 61.4 28.3 0 39.8-17.5 73.1-17.5 33.3 0 43.6 17.5 74 17.5 31.9 0 55.4-30 74.3-58.4 20-30 28.5-59.4 28.9-61-1.3-.5-85.1-32.6-85.2-79.2zM242.4 82.6c19.3-24 31.8-56.1 28.3-82.6-22.3 1-52.9 14.8-73.4 38.3-17.3 19.9-31.4 53.1-27.1 82.3 24.6 1.9 52.8-13.9 72.2-38z" />
                                </svg>
                            </span>
                            Apple로 계속
                        </button>

                        {/* 4. 이메일 로그인 (구현 예정) */}
                        <button
                            onClick={() => handleNotImplemented('이메일')}
                            style={btnStyle}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '20px' }}>✉️</span>
                            이메일로 계속
                        </button>

                        {/* 5. 전화번호 로그인 (구현 예정) */}
                        <button
                            onClick={() => handleNotImplemented('전화번호')}
                            style={btnStyle}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <span style={{ fontSize: '20px' }}>📱</span>
                            전화번호로 계속
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
