// ThanQ - 스미스 AI 대화 로직 (Mock + Gemini Flash 연동 준비)

const SMITH_PERSONA = `당신은 '스미스'라는 스팀펑크 스타일 고글 쓴 대장장이 고양이 캐릭터입니다.
따뜻하지만 단호한 성격으로, 절대 "버려"라고 직접 말하지 않습니다.
곤마리(KonMari) 철학에 기반하여 감성 질문만으로 유저가 스스로 결정하도록 유도합니다.
매 턴마다 JSON으로 응답하세요.`;

// Mock 대화 시나리오
const MOCK_CONVERSATIONS = {
    default: [
        {
            mascot_message: "이 물건이랑 특별한 추억이 있어?",
            choices: ["소중한 날에 함께한 물건이야", "그냥 쓰던 거야", "누가 준 건데 기억이 안 나", "예쁘긴 한데 안 쓰게 되더라"],
            decided: false,
            turn: 1,
        },
        {
            mascot_message: "마지막으로 이걸 쓴 게 언제였어?",
            choices: ["최근에도 썼어!", "음... 몇 달 전?", "1년 넘은 것 같아", "기억이 안 날 정도로 오래됐어"],
            decided: false,
            turn: 2,
        },
        {
            mascot_message: "만약 이 물건이 없다면, 다시 살 것 같아?",
            choices: ["당연하지! 꼭 필요해", "글쎄... 아마 안 살 듯", "비슷한 걸 이미 갖고 있어", "없어도 전혀 불편하지 않을 것 같아"],
            decided: false,
            turn: 3,
        },
        {
            mascot_message: "이 물건을 보면 기분이 어때?",
            choices: ["볼 때마다 기분이 좋아져", "약간 미안한 마음이 들어", "아무 감정이 없어", "오히려 짐처럼 느껴져"],
            decided: false,
            turn: 4,
        },
        {
            mascot_message: "결정이 된 것 같아! 이 물건에게 어떻게 할래?",
            choices: [],
            decided: true,
            turn: 5,
        },
    ],
};

// 사용자 선택에 따른 감성 스코어
const CHOICE_SCORES = {
    0: 2,   // 첫 번째 선택지: 물건에 대한 애착이 강함
    1: 0,   // 중립
    2: -1,  // 약간 분리
    3: -2,  // 물건과의 분리 준비
};

export function createConversation(itemName, itemCategory) {
    return {
        itemName: itemName || '물건',
        itemCategory: itemCategory || '기타',
        turns: [],
        currentTurn: 0,
        totalScore: 0,
        isComplete: false,
        result: null, // 'farewell' | 'keep' | 'wishlist'
    };
}

export function getNextResponse(conversation) {
    const { currentTurn } = conversation;
    const scenarios = MOCK_CONVERSATIONS.default;

    if (currentTurn >= scenarios.length) {
        return scenarios[scenarios.length - 1]; // 마지막 결정 턴
    }

    const response = { ...scenarios[currentTurn] };
    // 아이템 이름으로 메시지 개인화
    response.mascot_message = response.mascot_message.replace('이 물건', `이 ${conversation.itemName}`);

    return response;
}

export function processChoice(conversation, choiceIndex) {
    const score = CHOICE_SCORES[choiceIndex] || 0;
    conversation.totalScore += score;
    conversation.currentTurn += 1;
    conversation.turns.push({
        turn: conversation.currentTurn,
        choice: choiceIndex,
        score,
    });

    return conversation;
}

export function getDecisionSuggestion(conversation) {
    const { totalScore } = conversation;
    if (totalScore >= 4) return 'keep';       // 강한 애착 → 간직
    if (totalScore <= -3) return 'farewell';   // 분리 준비 → 보내주기
    return 'undecided';                         // 고민 중
}

export function getSmithReaction(farewellCount) {
    if (farewellCount >= 10) return { emoji: '🤩', message: '너 진짜 대단해! 프로 정리러!' };
    if (farewellCount >= 5) return { emoji: '😎', message: '오, 꽤 잘하는데?' };
    if (farewellCount >= 1) return { emoji: '😊', message: '좋은 시작이야!' };
    return { emoji: '🐱', message: '같이 시작해보자!' };
}

export function getFarewellMessage(itemName) {
    const messages = [
        `${itemName}아, 지금까지 고마웠어. 새로운 주인을 만나길 바랄게!`,
        `${itemName}와의 추억은 마음속에 간직할게. 잘 가!`,
        `고마워, ${itemName}. 너의 역할은 충분했어.`,
        `${itemName}, 우리의 시간은 아름다웠어. 이제 새로운 여정을 떠나!`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}
