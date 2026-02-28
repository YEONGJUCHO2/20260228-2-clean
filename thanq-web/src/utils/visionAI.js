const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export async function analyzeImageWithAI(imageUrl) {
    if (!API_KEY) {
        return { success: false, error: "GEMINI_API_KEY_MISSING" };
    }

    try {
        // 이미지 로드
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error("이미지 로드 실패"));
            img.src = imageUrl;
        });

        // 캔버스로 리사이즈 (최대 800px)
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
            }
        } else {
            if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG base64 추출
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = dataUrl.split(',')[1];

        const prompt = `당신은 물건 정리를 돕는 곤마리 스타일의 정리 요정 '스미스'의 스마트 시각 엔진입니다.
사용자가 보낸 물건의 사진을 보고, 이 물건이 정확히 무엇인지 명확하게 파악해서 분석해주세요.
반드시 아래의 JSON 형식으로만 딱 떨어지게 답변하고, 마크다운 백틱이나 부가적인 인사말은 절대 제외하세요.

{
    "itemName": "물건의 가장 흔하고 명확한 한글 명칭 (예: 무선 마우스, 텀블러, 운동화, 에어팟 등)",
    "category": "전자기기/가전은 electronics, 의류/신발은 clothes, 책/문서는 books, 기념품/편지는 memory, 그외 기타는 other"
}
`;

        // REST API 직접 호출 (SDK 대신 fetch 사용)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Data
                            }
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 오류 (${response.status}): ${errorData.error?.message || JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error("AI 응답이 비어있습니다");
        }

        // JSON 파싱
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        if (!parsed.itemName) {
            throw new Error("Invalid output format from AI (missing itemName)");
        }

        return {
            success: true,
            itemName: parsed.itemName,
            category: parsed.category || 'other'
        };

    } catch (error) {
        console.error("비전 AI 분석 실패:", error);
        return { success: false, error: error.message || error.toString() };
    }
}
