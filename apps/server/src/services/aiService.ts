import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeneratedPaper, QuestionTypeConfig } from '@vedaai/shared';

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your .env file.');
  }
  return new GoogleGenerativeAI(apiKey);
};

interface GenerationInput {
  title: string;
  subject: string;
  className: string;
  topic: string;
  questionTypes: QuestionTypeConfig[];
  additionalInstructions: string;
  fileContent?: string; // Extracted PDF text
}

function buildPrompt(input: GenerationInput): string {
  const totalQuestions = input.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
  const totalMarks = input.questionTypes.reduce((sum, qt) => sum + (qt.count * qt.marks), 0);

  const questionTypeDescriptions = input.questionTypes.map((qt, i) => {
    return `  Section ${String.fromCharCode(65 + i)}:
    - Type: ${qt.type}
    - Number of questions: ${qt.count}
    - Marks per question: ${qt.marks}
    - Total marks for section: ${qt.count * qt.marks}`;
  }).join('\n');

  let contextBlock = '';
  if (input.fileContent) {
    // Truncate to avoid token limits
    const truncated = input.fileContent.substring(0, 8000);
    contextBlock = `
REFERENCE MATERIAL (use this content to frame questions):
"""
${truncated}
"""
`;
  }

  return `You are an expert exam paper generator for Indian schools (CBSE/ICSE pattern).

Generate a complete, well-structured question paper based on the following specifications:

PAPER DETAILS:
- Title: ${input.title}
- Subject: ${input.subject}
- Class: ${input.className}
- Topic/Chapter: ${input.topic || 'General'}
- Total Questions: ${totalQuestions}
- Maximum Marks: ${totalMarks}
- Time Allowed: ${totalMarks <= 40 ? '1.5 Hours' : totalMarks <= 60 ? '2 Hours' : '3 Hours'}

SECTIONS:
${questionTypeDescriptions}

${input.additionalInstructions ? `ADDITIONAL INSTRUCTIONS FROM TEACHER:\n${input.additionalInstructions}\n` : ''}
${contextBlock}

DIFFICULTY DISTRIBUTION:
- Approximately 30% Easy, 50% Moderate, 20% Hard questions
- Distribute difficulty evenly across sections

RULES:
1. Questions must be age-appropriate for the class level
2. Questions should test different cognitive levels (knowledge, understanding, application, analysis)
3. MCQs must have exactly 4 options (a, b, c, d) with only one correct answer
4. Long answer questions should require detailed explanations
5. All questions must have clear, unambiguous wording
6. Provide an answer key for ALL questions

Respond ONLY with valid JSON matching this exact schema (no markdown, no code blocks, no extra text):

{
  "schoolName": "Delhi Public School",
  "subject": "${input.subject}",
  "className": "${input.className}",
  "timeAllowed": "<calculated time>",
  "maxMarks": ${totalMarks},
  "generalInstructions": [
    "All questions are compulsory.",
    "Read each question carefully before answering.",
    "Write neat and legible answers.",
    "Marks are indicated against each question."
  ],
  "sections": [
    {
      "title": "Section A",
      "subtitle": "<question type name>",
      "instruction": "Attempt all questions. Each question carries <N> marks.",
      "questions": [
        {
          "number": 1,
          "text": "<question text>",
          "difficulty": "Easy|Moderate|Hard",
          "marks": <marks>,
          "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
          "answer": "<correct answer>"
        }
      ]
    }
  ],
  "answerKey": [
    { "questionNumber": 1, "answer": "<answer>" }
  ]
}

IMPORTANT: 
- "options" field should ONLY be included for MCQ type questions
- Question numbers should be continuous across all sections
- Ensure the JSON is valid and complete`;
}

function parseAIResponse(text: string): GeneratedPaper {
  // Try to extract JSON from the response
  let jsonStr = text.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Find JSON object boundaries
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid paper structure: missing sections');
    }

    // Ensure all questions have required fields
    let questionNum = 1;
    for (const section of parsed.sections) {
      if (!section.questions || !Array.isArray(section.questions)) {
        section.questions = [];
      }
      for (const q of section.questions) {
        q.number = questionNum++;
        q.difficulty = q.difficulty || 'Moderate';
        q.marks = q.marks || 1;
      }
    }

    // Build answer key if missing
    if (!parsed.answerKey || parsed.answerKey.length === 0) {
      parsed.answerKey = [];
      for (const section of parsed.sections) {
        for (const q of section.questions) {
          if (q.answer) {
            parsed.answerKey.push({
              questionNumber: q.number,
              answer: q.answer,
            });
          }
        }
      }
    }

    return parsed as GeneratedPaper;
  } catch (error: any) {
    console.error('Failed to parse AI response:', error.message);
    console.error('Raw response (first 500 chars):', text.substring(0, 500));
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

export async function generatePaper(input: GenerationInput): Promise<GeneratedPaper> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const prompt = buildPrompt(input);

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return parseAIResponse(text);
}
