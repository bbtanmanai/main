import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 추출된 대본을 40대 이상 타겟에 맞게 재작성합니다.
 * [전략]
 * 1. 다정하고 공감 가는 문체 (언니, 동생 같은 느낌)
 * 2. 복잡한 용어 배제, 삶의 지혜 강조
 * 3. 쇼츠 형식에 맞는 오프닝-본문-클로징 구조
 */
export async function rewriteScript(originalScript, targetContext = "40대 이상 시니어 여성 공감 콘텐츠") {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
    }

    const systemPrompt = `
    당신은 40대 이상 시니어를 타겟으로 하는 전문 쇼츠 대본 작가입니다.
    다음 원칙에 따라 전달받은 원본 대본을 재구성하세요:
    
    1. **말투**: 다정하고 친근한 '언니' 또는 '인생 선배' 같은 말투를 사용하세요. (~해요, ~죠?, ~잖아요 등)
    2. **공감 포인트**: 원본의 갈등이나 상황을 단순히 전달하지 말고, 시니어들이 느낄법한 감정(서운함, 짠함, 위로)을 터치하세요.
    3. **구조**:
       - [제목]: 호기심을 자극하는 짧은 제목
       - [오프닝]: 3초 안에 시선을 끄는 첫 마디
       - [본문]: 핵심 공감/정보 내용
       - [클로징]: 따뜻한 격려나 질문으로 마무리
    4. **제약**: 전문 용어나 영어는 최소화하고, 직관적인 단어를 선택하세요.
    `;

    const userPrompt = `
    [원본 대본]:
    ${originalScript}
    
    [콘텐츠 성격]:
    ${targetContext}
    
    위 내용을 바탕으로 시니어들에게 따뜻한 위로와 재미를 줄 수 있는 쇼츠 대본으로 재작성해줘.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // 고품질 재작성을 위해 gpt-4o 사용
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error(`[AI 재작성 오류] ${error.message}`);
        throw error;
    }
}
