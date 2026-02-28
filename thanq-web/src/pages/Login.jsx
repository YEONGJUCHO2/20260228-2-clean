import { useNavigate } from 'react-router-dom';
import {
    signInWithGoogle,
    signInGuest,
    signInWithApple,
    signInWithEmailStore,
    signUpWithEmail,
    setupRecaptcha,
    requestPhoneOTP,
    verifyPhoneOTP
} from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export default function Login() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Auth States
    const [loginMode, setLoginMode] = useState('main'); // 'main', 'email', 'phone'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);

    useEffect(() => {
        // 인앱 브라우저 체크 (카카오톡, 인스타그램, 네이버 등)
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.match(/kakaotalk|instagram|naver|line|trill/i)) {
            setIsInAppBrowser(true);
            // 안드로이드 카카오톡인 경우 외부 브라우저 호출 시도
            if (userAgent.match(/android/i) && userAgent.match(/kakaotalk/i)) {
                window.location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(window.location.href);
            }
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        if (loginMode === 'phone') {
            setupRecaptcha('recaptcha-container');
        }
    }, [loginMode]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const result = await signInWithGoogle();
        if (result.success) navigate('/');
        else { alert('구글 로그인 실패: ' + result.error); setIsLoading(false); }
    };

    const handleGuestLogin = async () => {
        setIsLoading(true);
        const result = await signInGuest();
        if (result.success) {
            sessionStorage.setItem('guest_active', 'true');
            navigate('/');
        }
        else { alert('게스트 로그인 실패: ' + result.error); setIsLoading(false); }
    };

    const handleAppleLogin = async () => {
        setIsLoading(true);
        const result = await signInWithApple();
        if (result.success) navigate('/');
        else { alert('Apple 로그인 실패: ' + result.error); setIsLoading(false); }
    };

    const handleEmailSubmit = async (isSignUp) => {
        if (!email || !password) return alert('이메일과 비밀번호를 입력해주세요.');
        setIsLoading(true);
        const result = isSignUp
            ? await signUpWithEmail(email, password)
            : await signInWithEmailStore(email, password);

        if (result.success) {
            navigate('/');
        } else {
            alert(isSignUp ? '가입에 실패했습니다: ' + result.error : '로그인에 실패했습니다: ' + result.error);
            setIsLoading(false);
        }
    };

    const handlePhoneSubmit = async () => {
        if (!phone) return alert('전화번호를 입력해주세요.');
        setIsLoading(true);
        let formattedPhone = phone;
        if (phone.startsWith('010')) {
            formattedPhone = '+82' + phone.substring(1);
        }
        const result = await requestPhoneOTP(formattedPhone);
        if (result.success) {
            setOtpSent(true);
            alert('인증 코드가 전송되었습니다.');
        } else {
            alert('인증 코드 전송 실패: ' + result.error);
        }
        setIsLoading(false);
    };

    const handleOtpSubmit = async () => {
        if (!otp) return alert('인증 코드를 입력해주세요.');
        setIsLoading(true);
        const result = await verifyPhoneOTP(otp);
        if (result.success) navigate('/');
        else { alert('인증 코드 확인 실패: ' + result.error); setIsLoading(false); }
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

    const inputStyle = {
        width: '100%', padding: '14px', borderRadius: '12px',
        border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)',
        color: 'var(--text-color)', fontSize: '1rem',
        marginBottom: '10px'
    };

    const renderMainLogin = () => (
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

            <button
                onClick={handleAppleLogin}
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

            <button
                onClick={() => setLoginMode('email')}
                style={btnStyle}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <span style={{ fontSize: '20px' }}>✉️</span>
                이메일로 계속
            </button>

            <button
                onClick={() => setLoginMode('phone')}
                style={btnStyle}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <span style={{ fontSize: '20px' }}>📱</span>
                전화번호로 계속
            </button>
        </>
    );

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
                        {loginMode === 'main' && renderMainLogin()}
                        {loginMode === 'email' && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                                <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                                <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
                                <button onClick={() => handleEmailSubmit(false)} style={{ ...btnStyle, backgroundColor: 'var(--primary-color)', color: '#fff' }}>로그인</button>
                                <button onClick={() => handleEmailSubmit(true)} style={btnStyle}>회원가입</button>
                                <button onClick={() => setLoginMode('main')} style={{ ...btnStyle, border: 'none', backgroundColor: 'transparent' }}>뒤로 가기</button>
                            </div>
                        )}
                        {loginMode === 'phone' && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                                <input type="tel" placeholder="전화번호 (- 없이 입력, 예: 01012345678)" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} style={inputStyle} />
                                {!otpSent ? (
                                    <>
                                        <div id="recaptcha-container" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}></div>
                                        <button onClick={handlePhoneSubmit} style={{ ...btnStyle, backgroundColor: 'var(--primary-color)', color: '#fff' }}>인증번호 발송</button>
                                    </>
                                ) : (
                                    <>
                                        <input type="text" placeholder="인증 코드 6자리" value={otp} onChange={e => setOtp(e.target.value)} style={inputStyle} />
                                        <button onClick={handleOtpSubmit} style={{ ...btnStyle, backgroundColor: 'var(--primary-color)', color: '#fff' }}>로그인</button>
                                    </>
                                )}
                                <button onClick={() => { setLoginMode('main'); setOtpSent(false); }} style={{ ...btnStyle, border: 'none', backgroundColor: 'transparent' }}>뒤로 가기</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
