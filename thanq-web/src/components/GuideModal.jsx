import React from 'react';
import './GuideModal.css';

export default function GuideModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="guide-overlay" onClick={onClose}>
            <div className="guide-card animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button className="guide-close" onClick={onClose}>✕</button>
                <div className="guide-header">
                    <h2>ThanQ 가이드 📖</h2>
                    <p>스미스와 함께하는 미니멀 라이프</p>
                </div>

                <div className="guide-content">
                    <div className="guide-item">
                        <span className="guide-icon">📸</span>
                        <div className="guide-text">
                            <strong>사진 찍고 스미스와 대화하기</strong>
                            <p>홈 화면의 카메라 버튼을 눌러 물건 사진을 찍어보세요. 스미스가 물건을 인식하고 정리할지 고민을 들어줍니다.</p>
                        </div>
                    </div>
                    <div className="guide-item">
                        <span className="guide-icon">👋</span>
                        <div className="guide-text">
                            <strong>물건 보내주기 (작별)</strong>
                            <p>대화 후 '지금 결정할래' 버튼을 눌러 물건을 비우기로 결정할 수 있습니다. 따뜻한 작별 메시지를 남겨보세요.</p>
                        </div>
                    </div>
                    <div className="guide-item">
                        <span className="guide-icon">📌</span>
                        <div className="guide-text">
                            <strong>조금 더 보류하기 (추억함)</strong>
                            <p>아직 버리기 아쉽다면 보류하기를 선택하세요. 나중에 추억함에서 다시 꺼내보고 마음의 준비를 할 수 있습니다.</p>
                        </div>
                    </div>
                    <div className="guide-item">
                        <span className="guide-icon">🎯</span>
                        <div className="guide-text">
                            <strong>나의 미션 달성하기</strong>
                            <p>직접 미션을 만들거나 AI 추천을 받아 정리 목표를 세우고 달성해보세요. 조금씩 비워내는 재미를 느낄 수 있습니다.</p>
                        </div>
                    </div>
                </div>

                <button className="guide-ok-btn" onClick={onClose}>확인</button>
            </div>
        </div>
    );
}
