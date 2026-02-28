import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createConversation, getNextResponse, processChoice, getDecisionSuggestion, getFarewellMessage } from '../utils/smithAI';
import { addItem, CATEGORIES, guessCategory } from '../utils/storage';
import { analyzeImageWithAI } from '../utils/visionAI'; // 추가
import './Chat.css';

export default function Chat() {
    const navigate = useNavigate();
    const location = useLocation();

    // location.state에 imageCaptured가 있으면 분석 단계부터 시작
    const [step, setStep] = useState(location.state?.imageCaptured ? 'analyzing' : 'input'); // input | analyzing | chatting | deciding
    const [itemName, setItemName] = useState('');
    const [itemCategory, setItemCategory] = useState('other');
    const [autoGuessed, setAutoGuessed] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [currentResponse, setCurrentResponse] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef(null);

    // AI 이미지 분석 시뮬레이션 -> 진짜 Vision API 연동
    useEffect(() => {
        if (step === 'analyzing') {
            const processImage = async () => {
                if (!location.state?.imageUrl) {
                    setStep('input');
                    return;
                }

                // AI 분석 호출 (Gemini 1.5 Flash Vision)
                const aiResult = await analyzeImageWithAI(location.state.imageUrl);

                if (aiResult.success) {
                    const detectedName = aiResult.itemName;
                    // API에서 준 카테고리가 앱의 카테고리(clothing, electronics 등)에 맞는지 매핑, 아니면 guessCategory 폴백
                    const detectedCat = ['clothes', 'electronics', 'books', 'memory', 'other'].includes(aiResult.category)
                        ? aiResult.category : guessCategory(detectedName);

                    setItemName(detectedName);
                    setItemCategory(detectedCat);
                    setAutoGuessed(true);

                    // 자동으로 대화 시작
                    const conv = createConversation(detectedName, detectedCat);
                    setConversation(conv);
                    setStep('chatting');

                    setIsTyping(true);
                    setTimeout(() => {
                        const response = getNextResponse(conv);
                        setCurrentResponse(response);
                        setChatHistory([{
                            type: 'smith',
                            message: `사진을 분석해보니 ${detectedName} 같아! 한번 이야기해볼까?`,
                        }]);
                        setIsTyping(false);
                        scrollToBottom();

                        // 첫 질문
                        setTimeout(() => {
                            setIsTyping(true);
                            setTimeout(() => {
                                setChatHistory(prev => [...prev, { type: 'smith', message: response.mascot_message }]);
                                setIsTyping(false);
                                scrollToBottom();
                            }, 800);
                        }, 500);
                    }, 1000);
                } else {
                    if (aiResult.error === "GEMINI_API_KEY_MISSING") {
                        alert("API 키가 환경 변수(.env.local의 VITE_GEMINI_API_KEY)에 설정되지 않았습니다.\n(데모를 위해 수동 입력 모드로 전환합니다)");
                    } else {
                        console.error('Vision API Error:', aiResult.error);
                    }
                    setStep('input');
                }
            };

            // UX 향상을 위해 최소 2.5초는 로딩 애니메이션 보장 (빠르게 결과가 와도 깜빡임 방지)
            const minWait = new Promise(resolve => setTimeout(resolve, 2500));
            Promise.all([processImage(), minWait]);
        }
    }, [step, location.state]);

    const scrollToBottom = () => {
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const startChat = () => {
        if (!itemName.trim()) return;
        const conv = createConversation(itemName.trim(), itemCategory);
        setConversation(conv);
        setStep('chatting');

        // 첫 메시지
        setIsTyping(true);
        setTimeout(() => {
            const response = getNextResponse(conv);
            setCurrentResponse(response);
            setChatHistory([{
                type: 'smith',
                message: `${itemName}이(가) 보이는구나! 한번 이야기해볼까?`,
            }]);
            setIsTyping(false);
            scrollToBottom();

            // 첫 질문
            setTimeout(() => {
                setIsTyping(true);
                setTimeout(() => {
                    setChatHistory(prev => [...prev, { type: 'smith', message: response.mascot_message }]);
                    setIsTyping(false);
                    scrollToBottom();
                }, 800);
            }, 500);
        }, 1000);
    };

    const processNextTurn = (choiceIndex, userTextObj) => {
        if (userTextObj) {
            setChatHistory(prev => [...prev, userTextObj]);
        } else {
            const choiceText = currentResponse.choices[choiceIndex];
            setChatHistory(prev => [...prev, { type: 'user', message: choiceText }]);
        }

        const updated = processChoice({ ...conversation }, choiceIndex);
        setConversation(updated);
        scrollToBottom();

        // 5턴이면 결정 단계로
        if (updated.currentTurn >= 4) {
            setIsTyping(true);
            setTimeout(() => {
                const suggestion = getDecisionSuggestion(updated);
                let smithMsg = '';
                if (suggestion === 'farewell') {
                    smithMsg = '이야기를 들어보니, 이 물건의 역할은 이미 끝난 것 같아. 결정은 네가 하는 거야!';
                } else if (suggestion === 'keep') {
                    smithMsg = '이 물건, 아직 너한테 의미가 있는 것 같아! 결정은 네 마음에 달렸어.';
                } else {
                    smithMsg = '괜찮아! 고민이 되면 보관함에 넣어두자. 나중에 다시 이야기하자!';
                }
                setChatHistory(prev => [...prev, { type: 'smith', message: smithMsg }]);
                setStep('deciding');
                setIsTyping(false);
                setSelectedChoice(null);
                scrollToBottom();
            }, 1200);
            return;
        }

        // 다음 질문
        setIsTyping(true);
        setTimeout(() => {
            const nextResponse = getNextResponse(updated);
            setCurrentResponse(nextResponse);
            setChatHistory(prev => [...prev, { type: 'smith', message: nextResponse.mascot_message }]);
            setIsTyping(false);
            setSelectedChoice(null);
            scrollToBottom();
        }, 1200);
    };

    const handleChoice = (choiceIndex) => {
        if (selectedChoice !== null || isTyping) return;
        setSelectedChoice(choiceIndex);
        processNextTurn(choiceIndex, null);
    };

    const handleTextInput = () => {
        if (!userInput.trim() || isTyping) return;
        const textToProcess = userInput.trim();
        setUserInput('');
        setSelectedChoice(-1); // To disable text/choices
        processNextTurn(-1, { type: 'user', message: textToProcess });
    };

    const handleDecision = (decision) => {
        const item = {
            name: itemName,
            category: itemCategory,
            status: decision, // 'farewell' | 'wishlist'
            farewellMessage: decision === 'farewell' ? getFarewellMessage(itemName) : null,
        };
        addItem(item);

        if (decision === 'farewell') {
            navigate('/farewell', { state: { item } });
        } else {
            navigate('/archive');
        }
    };

    // === 분석 중 화면 ===
    if (step === 'analyzing') {
        return (
            <div className="page chat-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="scanning-container animate-fade-in" style={{ textAlign: 'center' }}>
                    <div className="animate-pulse" style={{ fontSize: '4rem', marginBottom: '20px' }}>👁️</div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: 'var(--text-color)' }}>스미스가 사진을 분석하고 있어요...</h2>
                    <p style={{ color: 'var(--text-muted)' }}>잠시만 기다려주세요</p>
                    {location.state?.imageUrl && (
                        <div style={{ marginTop: '30px', width: '160px', height: '160px', borderRadius: '20px', overflow: 'hidden', border: '3px solid var(--primary-color)', margin: '30px auto 0', opacity: 0.8, position: 'relative' }}>
                            <img src={location.state.imageUrl} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div className="scan-line" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--primary-color)', boxShadow: '0 0 8px var(--primary-color)', animation: 'scan 2s infinite linear' }}></div>
                            <style>{`
                               @keyframes scan {
                                   0% { top: 0; }
                                   50% { top: 100%; }
                                   100% { top: 0; }
                               }
                           `}</style>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // === 물건 입력 화면 ===
    if (step === 'input') {
        return (
            <div className="page chat-page">
                <div className="chat-input-section animate-fade-in-up">
                    <div className="smith-chat-avatar">
                        <span>🐱</span>
                        <div className="smith-goggle">🔧</div>
                    </div>
                    <div className="smith-intro-bubble">
                        <p>안녕! 나는 <strong>스미스</strong>야.</p>
                        <p>어떤 물건에 대해 이야기해볼까?</p>
                    </div>

                    <div className="input-card card">
                        {location.state?.imageCaptured && !itemName && (
                            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                                🤖 사진 인식에 실패했어요. 직접 입력해주세요!
                            </div>
                        )}
                        <label className="input-label">물건 이름</label>
                        <input
                            type="text"
                            className="item-input"
                            placeholder="예: 파란색 우산, 오래된 운동화..."
                            value={itemName}
                            onChange={e => {
                                const val = e.target.value;
                                setItemName(val);
                                if (val.trim().length >= 1) {
                                    const guess = guessCategory(val);
                                    setItemCategory(guess);
                                    setAutoGuessed(guess !== 'other');
                                } else {
                                    setItemCategory('other');
                                    setAutoGuessed(false);
                                }
                            }}
                            onKeyDown={e => e.key === 'Enter' && startChat()}
                            autoFocus
                        />
                        {autoGuessed && (
                            <p className="auto-guess-label animate-fade-in">
                                🤖 AI 추천: <strong>{CATEGORIES.find(c => c.id === itemCategory)?.icon} {CATEGORIES.find(c => c.id === itemCategory)?.name}</strong>
                                <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 6 }}>다르면 아래에서 변경하세요</span>
                            </p>
                        )}

                        <label className="input-label" style={{ marginTop: 16 }}>카테고리</label>
                        <div className="category-grid">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`category-btn ${itemCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setItemCategory(cat.id)}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>

                        <button className="start-chat-btn" onClick={startChat} disabled={!itemName.trim()}>
                            🐱 스미스와 대화 시작
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // === 대화 화면 ===
    return (
        <div className="page chat-page chat-active">
            {/* 아이템 헤더 */}
            <div className="chat-item-header animate-fade-in">
                <div className="chat-item-icon">
                    {CATEGORIES.find(c => c.id === itemCategory)?.icon || '📦'}
                </div>
                <div>
                    <p className="chat-item-name">{itemName}</p>
                    <p className="chat-item-cat">{CATEGORIES.find(c => c.id === itemCategory)?.name}</p>
                </div>
                <span className="chat-item-sparkle">✨</span>
            </div>

            {/* 대화 내용 */}
            <div className="chat-messages">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`message ${msg.type} animate-fade-in-up`} style={{ animationDelay: `${i * 0.05}s` }}>
                        {msg.type === 'smith' && <span className="msg-avatar">🐱</span>}
                        <div className={`msg-bubble ${msg.type}`}>
                            <p>{msg.message}</p>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="message smith animate-fade-in">
                        <span className="msg-avatar">🐱</span>
                        <div className="msg-bubble smith typing">
                            <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* 선택지 및 텍스트 력 */}
            {step === 'chatting' && currentResponse && !currentResponse.decided && !isTyping && (
                <div className="choices-container animate-fade-in-up">
                    <div className="choices-grid">
                        {currentResponse.choices.map((choice, i) => (
                            <button
                                key={i}
                                className={`choice-card ${selectedChoice === i ? 'selected' : ''}`}
                                onClick={() => handleChoice(i)}
                                disabled={selectedChoice !== null}
                            >
                                {choice}
                            </button>
                        ))}
                    </div>

                    {/* 직접 텍스트 입력 기능 */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <input
                            type="text"
                            placeholder="직접 입력할 수도 있어요..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTextInput()}
                            disabled={selectedChoice !== null}
                            style={{
                                flex: 1, padding: '12px 16px', borderRadius: '12px',
                                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)',
                                color: 'var(--text-color)', outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleTextInput}
                            disabled={!userInput.trim() || selectedChoice !== null}
                            style={{
                                padding: '12px 20px', borderRadius: '12px', border: 'none',
                                backgroundColor: userInput.trim() ? 'var(--primary-color)' : 'var(--border-color)',
                                color: userInput.trim() ? '#fff' : 'var(--text-muted)',
                                fontWeight: 'bold', cursor: userInput.trim() ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                            }}
                        >
                            전송
                        </button>
                    </div>

                    <button className="skip-btn" onClick={() => { handleDecision('wishlist'); }} style={{ marginTop: '16px' }}>
                        그냥 지금 결정할래
                    </button>
                </div>
            )}

            {/* 결정 버튼 */}
            {step === 'deciding' && (
                <div className="decision-container animate-fade-in-up">
                    <button className="decision-btn farewell" onClick={() => handleDecision('farewell')}>
                        🟢 보내줄게, 고마웠어
                    </button>
                    <button className="decision-btn keep" onClick={() => handleDecision('wishlist')}>
                        🔵 아직은 간직할게
                    </button>
                </div>
            )}
        </div>
    );
}
