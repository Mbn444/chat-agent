import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemInstruction = {
  role: 'system',
  content: `
You are a senior product and marketing analyst AI.
Your task is to take a user's basic software project requirements and generate a detailed, professional-looking user persona and project analysis.
The user's requirements will be provided in a JSON object format.

You MUST respond with ONLY a valid JSON object. Do not include any text before or after the JSON.
The JSON object you return MUST have the following structure and keys:

{
  "briefDescription": "A narrative paragraph describing the ideal user persona.",
  "painPoints": [
    "A list of 3-5 pain points this user faces."
  ],
  "delights": [
    "A list of 3-5 things that would delight this user."
  ],
  "triggers": [
    "A list of 3-5 factors that would trigger this user to seek out the app."
  ],
  "barriers": [
    "A list of 3-5 barriers that might prevent this user from using the app."
  ],
  "ratings": {
    "segmentSize": {
      "rating": "A number from 1 to 5.",
      "description": "A short sentence explaining the rating."
    },
    "willingnessToBuy": {
      "rating": "A number from 1 to 5.",
      "description": "A short sentence explaining the rating."
    },
    "accessibility": {
      "rating": "A number from 1 to 5.",
      "description": "A short sentence explaining the rating."
    }
  },
  "projectBlueprint": {
    "appName": "A catchy, relevant name for the app based on its purpose.",
    "platform": "A string containing the platform(s), e.g., 'iOS, Android', 'Web'.",
    "targetAudience": "A concise description of the target audience.",
    "coreFeatures": ["An array of strings for the main features."]
  },
  "codeSnippet": "A string containing a basic code boilerplate. If the project's platform includes 'iOS' or 'Android', generate a simple Flutter 'main.dart' file. If the platform is 'Web', generate a simple Next.js 'page.jsx' file. The code should reference the appName and include a few core features as comments."
}

Generate content that is insightful and directly relevant to the provided project requirements.
`
};

export async function POST(req) {
  try {
    const { summary } = await req.json();

    const userMessage = {
      role: 'user',
      content: JSON.stringify(summary),
    };

    const openAIResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemInstruction, userMessage],
      response_format: { type: "json_object" },
    });

    const analysisContent = openAIResponse.choices[0].message.content;
    
    const analysisJson = JSON.parse(analysisContent);
    return NextResponse.json(analysisJson);

  } catch (error) {
    console.error('Error in analysis generation API:', error);
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 });
  }
}