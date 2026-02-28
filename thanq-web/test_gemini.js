import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function test() {
    console.log("Key:", API_KEY);
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Dummy 1x1 base64 pixel
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

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
            mimeType: "image/png"
        },
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        console.log("Raw Response:", responseText);

        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        console.log("Parsed:", parsed);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
