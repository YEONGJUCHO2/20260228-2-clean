import { GoogleGenerativeAI } from "@google/generative-ai";

// 환경변수에서 API 키를 가져옵니다. (Vite 환경에서는 import.meta.env 사용)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeImageWithAI(imageUrl) {
    if (!API_KEY) {
        return { success: false, error: "GEMINI_API_KEY_MISSING" };
    }

    try {
        // Blob URL을 가져와서 Base64로 변환
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // 이미지를 1MB 이하 사이즈로 적절하게 다루기 위해 blob 바로 사용 (용량이 큰 경우 캔버스 리사이징이 필요할수도 있음)
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // Gemini SDK 초기화
        const genAI = new GoogleGenerativeAI(API_KEY);
        // 제일 빠르고 멀티모달 인식에 뛰어난 가벼운 모델인 1.5-flash 사용
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
당신은 물건 정리를 돕는 곤마리 스타일의 정리 요정 '스미스'의 스마트 시각 엔진입니다.
사용자가 보낸 물건의 사진을 보고, 이 물건이 정확히 무엇인지 파악해서 분석해주세요.
반드시 아래의 JSON 형식으로만 딱 떨어지게 답변하고, 마크다운 백틱 등 부가적인 인사말 등은 절대 제외하세요.

            {
                "itemName": "물건의 가장 흔하고 명확한 한글 명칭 (예: 무선 마우스, 텀블러, 운동화, 에어팟 등)",
                "category": "전자기기/가전은 electronics, 의류/신발은 clothes, 책/문서는 books, 기념품/편지는 memory, 그외 기타는 other"
}
        `;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: blob.type
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        // JSON 파싱 시도 (마크다운 백틱 등 필터링)
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        if (!parsed.itemName) {
            throw new Error("Invalid output format from AI");
        }

        return {
            success: true,
            itemName: parsed.itemName,
            category: parsed.category || 'other'
        };

    } catch (error) {
        console.error("비전 AI 분석 실패:", error);
        return { success: false, error: error.message };
    }
}
