import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation, getNextResponse, processChoice, getDecisionSuggestion, getFarewellMessage } from '../utils/smithAI';
import { addItem, CATEGORIES, guessCategory } from '../utils/storage';
import './Chat.css';

export default function Chat() {
    const navigate = useNavigate();
    const [step, setStep] = useState('input'); // input | chatting | deciding
    const [itemName, setItemName] = useState('');
    const [itemCategory, setItemCategory] = useState('other');
    const [autoGuessed, setAutoGuessed] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [currentResponse, setCurrentResponse] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedChoice, setSelectedChoice] = useState(null);
    const chatEndRef = useRef(null);

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

    const handleChoice = (choiceIndex) => {
        if (selectedChoice !== null) return;
        setSelectedChoice(choiceIndex);

        const choiceText = currentResponse.choices[choiceIndex];
        setChatHistory(prev => [...prev, { type: 'user', message: choiceText }]);

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

            {/* 선택지 카드 */}
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
                    <button className="skip-btn" onClick={() => { handleDecision('wishlist'); }}>
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
