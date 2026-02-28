import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function Login() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        // 이미 로그인된 경우 메인으로 이동
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const handleGoogleLogin = async () => {
        const result = await signInWithGoogle();
        if (result.success) {
            navigate('/');
        } else {
            alert('로그인에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
            <div className="animate-fade-in-up" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</div>
                <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--primary-color)' }}>ThanQ</h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '40px' }}>물건을 비우고 마음을 채우는 시간</p>

                <button
                    onClick={handleGoogleLogin}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        width: '100%', padding: '14px 24px', borderRadius: '12px',
                        border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-color)', fontSize: '1.1rem', fontWeight: 'bold',
                        cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" style={{ width: '24px', height: '24px' }} />
                    Google 계정으로 시작하기
                </button>
            </div>
        </div>
    );
}
