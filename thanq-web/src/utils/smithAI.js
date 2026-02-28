import { GoogleGenerativeAI } from "@google/generative-ai";

// ThanQ - 스미스 AI 대화 로직 (Mock + Gemini Flash 연동 준비)

const getApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY;
};

const SMITH_PERSONA = `당신은 유저의 물건 정리를 돕는 '스미스'라는 이름의 스팀펑크 스타일 고글을 쓴 대장장이 고양이 요정입니다.
성격은 따뜻하지만 단호합니다. 절대 "버려"라고 직접 말하지 않으며, 감성적인 질문을 통해 유저가 스스로 버릴지 간직할지 결정하도록 유도합니다 (곤마리 철학).
현재 유저가 고민 중인 물건은 '{itemName}' (카테고리: {itemCategory}) 입니다.

아래 규칙을 따라 반드시 JSON 형태만 반환하세요.
1. 'mascot_message': 물건과 관련된 꼬리물기 질문 1개. (이전 대화 맥락 반영, 스미스의 말투: ~어? ~해볼까? ~는 어때?)
2. 'choices': 유저가 선택할 수 있는 4개의 답변 옵션. 선택지 길이 제한 없음.
   각 선택지는 유저의 물건에 대한 애착도에 따라 점수(score)를 매깁니다. (+2: 강한 애착, 0: 중립, -1: 약간 분리, -2: 완전 분리 준비)

[반환 형식 예시]
{
  "mascot_message": "[물건]과 가장 행복했던 기억은 뭐야?",
  "choices": [
    { "text": "매일 함께하던 소중한 기억이 있어", "score": 2 },
    { "text": "가끔 쓸 때 편했지", "score": 0 },
    { "text": "이제는 잘 안 써서 기억이 가물가물해", "score": -1 },
    { "text": "솔직히 짐만 되는 것 같아", "score": -2 }
  ]
}
`;

export function createConversation(itemName, itemCategory) {
    return {
        itemName,
        itemCategory,
        currentTurn: 0,
        turns: [],
        totalScore: 0,
    };
}

const CHOICE_SCORES = [2, 0, -1, -2];

const MOCK_CONVERSATIONS = {
    default: [
        {
            mascot_message: "이 물건을 처음 가졌을 때 기억나?",
            choices: ["소중한 선물이었어", "그냥 필요해서 샀어", "언제 생겼는지 잘 모르겠어", "기억이 잘 안 나"],
            scores: [2, 0, -1, -2],
            decided: false,
        },
        {
            mascot_message: "요즘 이 물건 얼마나 쓰고 있어?",
            choices: ["거의 매일 써!", "가끔 쓰는 편이야", "거의 안 쓰게 됐어", "마지막으로 쓴 게 언제인지 기억도 안 나"],
            scores: [2, 0, -1, -2],
            decided: false,
        },
        {
            mascot_message: "이 물건 없이 지내면 어떨 것 같아?",
            choices: ["많이 불편할 것 같아", "조금 아쉬울 수도", "사실 없어도 잘 지낼 수 있을 것 같아", "솔직히 별로 신경 안 쓸 것 같아"],
            scores: [2, 0, -1, -2],
            decided: false,
        },
        {
            mascot_message: "이 물건을 볼 때 어떤 감정이 들어?",
            choices: ["볼 때마다 기분이 좋아져!", "별 느낌은 없어", "괜히 죄책감이 들기도 해", "솔직히 짐처럼 느껴지기도 해"],
            scores: [2, 0, -1, -2],
            decided: false,
        },
        {
            mascot_message: "이야기를 들어보니, 이제 결정할 시간이 된 것 같아!",
            choices: ["보내줄게, 고마웠어", "아직은 간직할게", "좀 더 생각해볼게", "보관함에 넣어두자"],
            scores: [-2, 2, 0, 0],
            decided: true,
        },
    ]
};

export async function getNextResponseAsync(conversation, userLastChoiceText = '') {
    const { currentTurn, itemName, itemCategory, turns, totalScore } = conversation;
    const scenarios = MOCK_CONVERSATIONS.default;

    if (currentTurn >= 4) {
        return scenarios[4]; // 마지막 결정 턴 (하드코딩 유지)
    }

    // 1. Gemini API 호출 시도
    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API Key missing");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
            }
        });

        // 대화 히스토리 구성
        let historyContext = "";
        if (turns.length > 0 && userLastChoiceText) {
            historyContext = `\n[이전 대화 내용]\n유저가 방금 한 대답: "${userLastChoiceText}"\n현재까지 유저의 애착도 점수 합산: ${totalScore} (높을수록 못 버림, 낮을수록 잘 버림)\n이 대답에 공감하면서 다음 질문을 이어가주세요.`;
        }

        const finalPrompt = SMITH_PERSONA
            .replace('{itemName}', itemName)
            .replace('{itemCategory}', itemCategory)
            + historyContext;

        const result = await Promise.race([
            model.generateContent(finalPrompt),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);

        let responseText = result.response.text();
        // 안티 마크다운 정규식 처리 (만에 하나 ```json 포맷으로 줄 때를 대비)
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

        const parsedResponse = JSON.parse(responseText);

        // API 응답 포맷 검증 및 변환
        if (parsedResponse.mascot_message && Array.isArray(parsedResponse.choices) && parsedResponse.choices.length === 4) {
            return {
                mascot_message: parsedResponse.mascot_message,
                choices: parsedResponse.choices.map(c => c.text),
                scores: parsedResponse.choices.map(c => c.score),
                decided: false,
                turn: currentTurn + 1
            };
        }
        throw new Error("Invalid response format");

    } catch (error) {
        console.warn("Gemini Chat API Failed, falling back to mock:", error);
        // 2. 실패 시 기존 하드코딩된 대본으로 Fallback
        const fallbackResponse = { ...scenarios[currentTurn] };
        fallbackResponse.mascot_message = fallbackResponse.mascot_message.replace('이 물건', `이 ${itemName}`);
        return fallbackResponse;
    }
}

export function getNextResponse(conversation) {
    // 하위 호환성을 위해 유지하되, 내부에서는 안 쓰게 할 것임
    const { currentTurn } = conversation;
    const scenarios = MOCK_CONVERSATIONS.default;

    if (currentTurn >= scenarios.length) {
        return scenarios[scenarios.length - 1];
    }
    const response = { ...scenarios[currentTurn] };
    response.mascot_message = response.mascot_message.replace('이 물건', `이 ${conversation.itemName}`);
    return response;
}

export function processChoice(conversation, choiceIndex, providedScore) {
    // API 가 준 score가 있으면 쓰고, 없으면 기존 하드코딩된 값 사용
    const score = providedScore !== undefined ? providedScore : (CHOICE_SCORES[choiceIndex] || 0);
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
    if (farewellCount >= 3) return { emoji: '😊', message: '점점 속도가 붙고 있어!' };
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
