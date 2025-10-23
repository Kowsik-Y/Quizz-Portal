export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export const geminiConfig = {
  temperature: 0.3,
  maxOutputTokens: 2048,
  topP: 0.95,
  topK: 40,
};

export const generateQuestionsWithGemini = async (
  prompt: string,
  questionType: 'mcq' | 'code' | 'theory',
  numberOfQuestions: number
) => {
  const apiKey = GEMINI_API_KEY;
  const questionPrompt = `Generate ${numberOfQuestions} ${questionType} questions based on the following topic/prompt: "${prompt}". 
  
  Return ONLY a valid JSON array without any markdown formatting or code blocks. Each question should have:
  - question_text: the question
  - question_type: "${questionType}"
  - points: 10
  ${questionType === 'mcq' ? '- options: array of 4 options as strings\n- correct_answer: the correct option text' : ''}
  ${questionType === 'theory' ? '- correct_answer: a model answer (optional)' : ''}
  ${questionType === 'code' ? '- test_cases: array of test case objects, each with "input", "expected_output", and "points" fields. Each test case should have realistic input values and corresponding expected outputs.\n- correct_answer: a sample solution (optional)' : ''}
  
  Example format:
  [
    {
      "question_text": "Question here?",
      "question_type": "${questionType}",
      "options": ${questionType === 'mcq' ? '["Option A", "Option B", "Option C", "Option D"]' : 'null'},
      "test_cases": ${questionType === 'code' ? '[{"input": "2\\n3", "expected_output": "5", "points": 5}, {"input": "10\\n20", "expected_output": "30", "points": 5}]' : 'null'},
      "correct_answer": "Correct answer here",
      "points": 10
    }
  ]`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: questionPrompt
        }]
      }],
      generationConfig: geminiConfig
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || response.statusText;
    throw new Error(`Error: ${response.status} - ${errorMessage}`);
  }

  const data = await response.json();
  
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    let jsonText = data.candidates[0].content.parts[0].text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : [parsed];
  } else {
    throw new Error('Invalid response');
  }
};
