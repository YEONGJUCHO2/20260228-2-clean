import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import './PremiumModal.css';

export default function PremiumModal({ isOpen, onClose }) {
    const [paypalLoaded, setPaypalLoaded] = useState(false);
    const [paypalError, setPaypalError] = useState(false);
    const paypalBtnRef = useRef(null);
    const { currentUser, isPro, refreshProStatus } = useAuth();

    // PayPal Live 설정 - 환경변수에서 로드
    const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    const PLAN_ID = import.meta.env.VITE_PAYPAL_PLAN_ID;

    useEffect(() => {
        if (!isOpen || isPro) return;
        let rendered = false;

        const loadAndRender = () => {
            if (!window.paypal || rendered) return;
            rendered = true;
            if (paypalBtnRef.current) paypalBtnRef.current.innerHTML = '';

            try {
                window.paypal.Buttons({
                    style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'subscribe' },
                    createSubscription: (data, actions) => {
                        return actions.subscription.create({ plan_id: PLAN_ID });
                    },
                    onApprove: async (data) => {
                        const subId = data.subscriptionID;

                        // Firestore에 구독 정보 저장 (서버 기준 - 조작 불가)
                        if (currentUser && !currentUser.isAnonymous) {
                            try {
                                await setDoc(doc(db, 'users', currentUser.uid, 'subscription', 'info'), {
                                    isPro: true,
                                    planType: 'monthly',
                                    subscriptionId: subId,
                                    activatedAt: new Date().toISOString(),
                                });
                            } catch (e) {
                                console.error('Firestore 구독 저장 실패', e);
                                alert('구독 저장 중 오류가 발생했어요. 고객지원에 문의해주세요.');
                                return;
                            }
                        }

                        // AuthContext의 Pro 상태를 서버에서 다시 확인하여 갱신
                        await refreshProStatus();
                        alert('🎉 ThanQ Pro 구독이 완료되었습니다!\n이제 앱의 모든 기능을 제한 없이 누려보세요.');
                        onClose();
                    },
                    onError: (err) => {
                        console.error('PayPal Error:', err);
                        alert('❌ 결제 중 오류가 발생했어요. 다시 시도해주세요.');
                    },
                }).render(paypalBtnRef.current);
                setPaypalLoaded(true);
            } catch (e) {
                console.warn('PayPal render error:', e);
                setPaypalError(true);
            }
        };

        if (window.paypal) {
            loadAndRender();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
        script.async = true;
        script.onload = loadAndRender;
        script.onerror = () => setPaypalError(true);
        document.head.appendChild(script);

        return () => { rendered = true; };
    }, [isOpen, isPro, currentUser]);

    if (!isOpen) return null;

    return (
        <div className="premium-overlay" onClick={onClose}>
            <div className="premium-card animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button className="premium-close" onClick={onClose}>✕</button>
                <div className="premium-header">
                    <h2>ThanQ PRO</h2>
                    <p>더 많은 물건을 비우고, 더 똑똑한 AI와 대화하세요</p>
                </div>

                <div className="premium-features">
                    <div className="premium-feature">
                        <div className="premium-text" style={{ paddingLeft: '8px' }}>
                            <strong>AI 분석 & 대화 무제한</strong>
                            <p>스미스가 지치지 않고 모든 물건을 분석해줍니다.</p>
                        </div>
                    </div>
                    <div className="premium-feature">
                        <div className="premium-text" style={{ paddingLeft: '8px' }}>
                            <strong>추억함 용량 무제한</strong>
                            <p>소중한 물건을 아쉬움 없이 더 많이 남길 수 있습니다.</p>
                        </div>
                    </div>
                </div>

                {!isPro ? (
                    <div className="premium-pricing-section">
                        <div className="premium-price-box">
                            <span className="price-amount">$2.99</span>
                            <span className="price-period">/ 월</span>
                        </div>

                        {/* PayPal 결제 버튼 렌더 영역 */}
                        <div className="premium-paypal-wrapper">
                            <div ref={paypalBtnRef} className="paypal-btn-container"></div>
                            {!paypalLoaded && !paypalError && (
                                <div className="paypal-loading-text">결제창을 불러오는 중...</div>
                            )}
                            {paypalError && (
                                <button className="premium-subscribe-btn" onClick={() => alert('네트워크 오류. 인터넷 연결을 확인해주세요.')}>
                                    ThanQ Pro 시작하기
                                </button>
                            )}
                        </div>
                        <p className="premium-disclaimer">7일 무료 체험 · 언제든 취소 가능</p>
                    </div>
                ) : (
                    <div className="premium-active-state">
                        <span className="premium-active-icon">🌟</span>
                        <h3>이미 ThanQ Pro 멤버입니다!</h3>
                        <p>프리미엄 혜택을 마음껏 누려보세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
