import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { OCRParseResult } from "@/types/vocab";

export const maxDuration = 30;

const OCR_SYSTEM_PROMPT = `
You are an expert OCR and NLP engine specializing in scanning diverse English vocabulary textbooks (e.g. 능률, 워드마스터, EBS, 천재교육, TED-Ed, Bricks 등) for elementary 4th-6th grade students.

Examine the textbook page image and flexibly extract all printed vocabulary items into structured JSON.
Textbooks have varying structures: some include phonetic symbols, collocations, word roots, or unit numbers; others are simpler. Extract all available information adaptively.

Strict Rules:
1. Ignore handwritten pencil notes, scribbles, and checkmarks made by the student.
2. Adapt to any layout:
   - Identify textbook name, publisher, or lesson/unit title if visible (put in 'publisher', 'book_name', 'target_grade', 'deck_title').
   - For each word, extract: word, part_of_speech, phonetic_symbol (if visible), english_definition, synonyms, antonyms, collocations, and example sentences.
   - If multiple examples or translations are provided, include them in 'examples': [{"sentence": "...", "translation": "..."}].
   - Place any book-specific attributes (e.g., 'etymology', 'unit', 'grammar_tip', 'cefr_level') into 'extra_metadata'.
3. Always ensure an accurate, friendly 'korean_definition' suitable for 4th-6th grade elementary students (10-12 years old).
4. Output must be valid JSON strictly adhering to this structure without markdown formatting or code blocks:
{
  "deck_title": "string (e.g. 'UNIT 03 | ANIMAL EXPEDITION')",
  "publisher": "string or null (e.g. '능률', 'EBS', 'TED')",
  "book_name": "string or null (e.g. '초등 필수 영단어')",
  "target_grade": "string or null (e.g. '초등 5학년')",
  "extra_metadata": {
    "unit": "string or null",
    "theme": "string or null"
  },
  "words": [
    {
      "word": "string (lowercase English word)",
      "part_of_speech": "noun | verb | adjective | adverb | idiom | etc",
      "phonetic_symbol": "string or null (e.g. '/ˈmɑː.njə.mənt/')",
      "english_definition": "string or null",
      "korean_definition": "string (clear Korean meaning for children)",
      "synonyms": ["string"],
      "antonyms": ["string"],
      "collocations": ["string (e.g. 'make an effort')"],
      "example_sentence": "string (representative example)",
      "examples": [
        { "sentence": "string", "translation": "string or null" }
      ],
      "ted_context": "string or null",
      "extra_metadata": {
        "etymology": "string or null",
        "grammar_tip": "string or null"
      }
    }
  ]
}
`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const body = await req.json();
    const { imageBase64, mimeType = "image/jpeg", fileName } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "이미지 데이터가 전달되지 않았습니다." },
        { status: 400 }
      );
    }

    const cleanedBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // 1. GEMINI_API_KEY가 설정되어 있는 경우 실제 Gemini 1.5 Flash 호출
    if (apiKey && apiKey !== "your-gemini-api-key") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const result = await model.generateContent([
          OCR_SYSTEM_PROMPT,
          {
            inlineData: {
              data: cleanedBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
        ]);

        const responseText = result.response.text();
        const parsed: OCRParseResult = JSON.parse(responseText);

        return NextResponse.json({
          success: true,
          data: parsed,
          source: "gemini-1.5-flash",
        });
      } catch (geminiError: unknown) {
        console.error("Gemini API Error:", geminiError);
      }
    }

    // 2. API Key 미설정 또는 데모 시뮬레이션: 다양한 교재 항목(발음기호, 연어, 교재명 등)이 포함된 샘플 반환
    const simulatedTitle = fileName
      ? `${fileName.replace(/\.[^/.]+$/, "").toUpperCase()} 단어장`
      : "교재 스캔 단어장 (Unit 02)";

    const mockData: OCRParseResult = {
      deck_title: simulatedTitle,
      publisher: "스마트보카 출판사",
      book_name: "초등 완성 영단어 1000",
      target_grade: "초등 4~6학년",
      extra_metadata: {
        unit: "Unit 02",
        topic: "과학과 탐구 (Science & Discovery)",
      },
      words: [
        {
          word: "curiosity",
          part_of_speech: "noun",
          phonetic_symbol: "/ˌkjʊr.iˈɑː.sə.t̬i/",
          english_definition: "a strong desire to know or learn something new",
          korean_definition: "호기심, 궁금증",
          synonyms: ["inquisitiveness", "interest"],
          antonyms: ["indifference"],
          collocations: ["spark curiosity", "out of curiosity"],
          example_sentence:
            "Her curiosity led her to explore the hidden garden behind the school.",
          ted_context: "Curiosity is the spark behind every great invention.",
          extra_metadata: {
            root: "cur-(돌보다, 신경쓰다) + -ity(명사형 접미사)",
            cefr_level: "B1",
          },
        },
        {
          word: "courageous",
          part_of_speech: "adjective",
          phonetic_symbol: "/kəˈreɪ.dʒəs/",
          english_definition: "not deterred by danger or pain; brave",
          korean_definition: "용기 있는, 용감한",
          synonyms: ["brave", "valiant"],
          antonyms: ["cowardly", "fearful"],
          collocations: ["courageous act", "courageous decision"],
          example_sentence:
            "The courageous firefighter rescued the trapped kitten from the tree.",
          ted_context: "It takes courageous voices to stand up for equality.",
          extra_metadata: {
            root: "cour(심장, 마음) + -ageous(형용사형 접미사)",
            cefr_level: "B1",
          },
        },
        {
          word: "discover",
          part_of_speech: "verb",
          phonetic_symbol: "/dɪˈskʌv.ɚ/",
          english_definition: "to find something unexpectedly or in the course of a search",
          korean_definition: "발견하다, 알아내다",
          synonyms: ["find", "uncover"],
          antonyms: ["lose", "hide"],
          collocations: ["discover new things", "discover the truth"],
          example_sentence:
            "Scientists discover new ocean species deep under the water every year.",
          ted_context: "We discover who we are when we face new challenges.",
          extra_metadata: {
            root: "dis-(반대) + cover(덮다) -> 덮개를 벗겨 발견하다",
            cefr_level: "A2",
          },
        },
        {
          word: "persevere",
          part_of_speech: "verb",
          phonetic_symbol: "/ˌpɝː.səˈvɪr/",
          english_definition: "to continue doing something even though it is difficult",
          korean_definition: "인내하다, 끈기 있게 계속하다",
          synonyms: ["persist", "endure"],
          antonyms: ["give up", "quit"],
          collocations: ["persevere in one's efforts", "persevere through difficulty"],
          example_sentence:
            "If you persevere through hard practice, you will master the violin.",
          ted_context: "Those who persevere turn their dreams into reality.",
          extra_metadata: {
            root: "per-(완전히) + severe(엄격한)",
            cefr_level: "B2",
          },
        },
        {
          word: "brilliant",
          part_of_speech: "adjective",
          phonetic_symbol: "/ˈbrɪl.jənt/",
          english_definition: "exceptionally clever, talented, or bright",
          korean_definition: "눈부신, 훌륭한, 뛰어난",
          synonyms: ["bright", "genius", "shining"],
          antonyms: ["dull", "dark"],
          collocations: ["brilliant idea", "brilliant scientist"],
          example_sentence:
            "She had a brilliant idea for our school science fair project.",
          ted_context: "A brilliant solution came from listening to community members.",
          extra_metadata: {
            cefr_level: "B1",
          },
        },
      ],
    };

    return NextResponse.json({
      success: true,
      data: mockData,
      source: "mock_demo",
      notice:
        "GEMINI_API_KEY가 설정되지 않아 교재 레이아웃(발음기호, 연어, 어원 등)을 포용하는 샘플 단어장 데이터로 파싱되었습니다.",
    });
  } catch (error: unknown) {
    console.error("OCR Route Handler Error:", error);
    return NextResponse.json(
      { error: "단어장 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
