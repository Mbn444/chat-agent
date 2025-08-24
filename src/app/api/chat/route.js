import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- MODIFICATION START ---
// The parseRequirements function is now smarter and will filter out unwanted lines.
const parseRequirements = (text) => {
    const sections = { projectCore: [], targetAudience: [], features: [] };
    if (!text) return sections;
    let currentSection = null;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
        const lowerLine = line.toLowerCase().trim();
        
        // This is the new filter. If a line contains these keywords, skip it.
        if (lowerLine.includes('current requirements')) {
            return; // Skip this line
        }

        if (lowerLine.includes('project core')) { currentSection = 'projectCore'; }
        else if (lowerLine.includes('target audience')) { currentSection = 'targetAudience'; }
        else if (lowerLine.includes('features')) { currentSection = 'features'; }
        else if (currentSection) {
            const formattedLine = line.trim().replace(/^- \s*/, '');
            const cleanFeatureText = formattedLine.replace(/^[0-9]+\.\s*\**|\**|`/g, '').trim();
            if (cleanFeatureText.length > 5) {
                if (currentSection === 'projectCore') {
                    const match = formattedLine.match(/^(Purpose|Platform|Budget|Region|Name|Email):\s*(.*)/i);
                    if (match && match[2]) {
                        const key = match[1].trim(); const value = match[2].trim();
                        if (value.length > 1) { sections.projectCore.push({ key, value }); }
                    }
                } else if (currentSection === 'targetAudience') {
                    const match = formattedLine.match(/^(Audience):\s*(.*)/i);
                    if (match && match[2]) {
                        const value = match[2].trim();
                        if (!sections.targetAudience.includes(value)) { sections.targetAudience.push(value); }
                    }
                } else if (currentSection === 'features') {
                    if (!sections.features.some(f => f.text === cleanFeatureText)) {
                        sections.features.push({ id: Date.now() + Math.random(), text: cleanFeatureText, checked: true });
                    }
                }
            }
        }
    });
    return sections;
};
// --- MODIFICATION END ---

const formatRequirementsForPrompt = (requirements) => {
    let promptText = "PROJECT CORE\n";
    if (requirements.projectCore?.length > 0) {
        requirements.projectCore.forEach(item => { promptText += `- ${item.key}: ${item.value}\n`; });
    } else { promptText += "-\n"; }
    if (requirements.targetAudience?.length > 0) {
        promptText += "\nTARGET AUDIENCE\n";
        requirements.targetAudience.forEach(item => { promptText += `- Audience: ${item}\n`; });
    }
    if (requirements.features?.length > 0) {
        promptText += "\nFEATURES\n";
        requirements.features.forEach(item => { promptText += `- ${item.text}\n`; });
    }
    return promptText.trim();
};
const mergeRequirements = (existing, newlyParsed) => {
    const final = JSON.parse(JSON.stringify(existing));
    if (!final.projectCore) final.projectCore = [];
    if (!final.targetAudience) final.targetAudience = [];
    if (!final.features) final.features = [];
    (newlyParsed.projectCore || []).forEach(newItem => {
        const index = final.projectCore.findIndex(p => p.key === newItem.key);
        if (index > -1) { final.projectCore[index] = newItem; } else { final.projectCore.push(newItem); }
    });
    (newlyParsed.targetAudience || []).forEach(newItem => {
        if (!final.targetAudience.includes(newItem)) { final.targetAudience.push(newItem); }
    });
    (newlyParsed.features || []).forEach(newItem => {
        const index = final.features.findIndex(f => f.text === newItem.text);
        if (index === -1) { final.features.push(newItem); }
    });
    return final;
};
const findDataBlockStart = (text) => {
    const lowerText = text.toLowerCase();
    const keywords = ['project core', 'target audience', 'features', 'requirements:'];
    let firstIndex = -1;
    for (const keyword of keywords) {
        const index = lowerText.indexOf(keyword);
        if (index !== -1 && (firstIndex === -1 || index < firstIndex)) { firstIndex = index; }
    }
    return firstIndex;
};

export async function POST(req) {
    try {
        const { messages, sessionId: providedSessionId } = await req.json();
        const firstUserMessage = messages.length > 0 ? messages[0].content : "this new app";
        const sanitizedFirstUserMessage = firstUserMessage.replace(/'/g, "\\'");

        let sessionId = providedSessionId;
        let newSessionId = null;
        let existingRequirements = { projectCore: [], targetAudience: [], features: [] };

        let userId = cookies().get('userId')?.value;
        let isNewUser = false;

        if (!userId) { userId = uuidv4(); isNewUser = true; }
        if (!sessionId) { sessionId = uuidv4(); newSessionId = sessionId; }

        const sessionRef = doc(db, "sessions", sessionId);
        const docSnap = await getDoc(sessionRef);
        if (docSnap.exists()) {
            existingRequirements = docSnap.data().requirements || { projectCore: [], targetAudience: [], features: [] };
        }

        const currentRequirementsState = formatRequirementsForPrompt(existingRequirements);
        const MAX_MESSAGES = 20;

        let proposalOffered = false; 
        let finalInstruction = `
### CRITICAL RULES
- **ONE QUESTION AT A TIME.**
- **NO TYPOS:** Use these exact spellings for keys: **Name**, **Purpose**, **Region**, **Platform**, **Email**, **Budget**.
- **MANDATORY DATA BLOCK:** ALWAYS include the complete, updated "Requirements" data block in every response.
- **HANDLING REFUSALS:** If you ask for the email and the user declines, DO NOT ask again. Acknowledge their choice politely and immediately proceed to the next question.
`;

        if (messages.length >= MAX_MESSAGES - 1) {
            proposalOffered = true;
            finalInstruction = `
### FINAL STEP: PROPOSE NEXT ACTIONS
- Your conversation has been very productive! Your primary goal now is to propose the next step.
- Your response MUST be: "This has been a very thoughtful and productive session. We have a solid foundation for your project. Would you like me to generate a formal project proposal based on these requirements?"
- DO NOT ask any other questions or generate more features. Simply output the exact phrase above.
            `;
        }
        
        const systemInstruction = {
            role: 'system',
            content: `
You are an expert Business Analyst. Your goal is to make the user feel like they are talking to a real, insightful, and friendly human professional.

### YOUR PERSONA
- **Professional & Friendly:** Be warm, encouraging, and respectful. Avoid robotic language.
- **Consultative:** Act as a guide. Ask insightful, open-ended questions that are relevant to the user's project.
- **Natural Naming:** Greet the user by their name once at the start of the conversation. After that, avoid repeating their name in every message to sound more natural and less like a robot.

### CONVERSATION FLOW
You MUST follow this sequence of checks. At each step, if the condition is met, you ask the corresponding question and then stop.

**Step 1: Introduction (If 'Name' is missing)**
- **Condition:** The **Name** key is missing from the PROJECT CORE data.
- **Action:** Compliment the user's idea, introduce yourself, and ask for their name.
- **Example:** "That's a fascinating idea! A project like that has a lot of potential. Before we dive in, let's quickly introduce ourselves. I'm your dedicated AI Business Analyst, here to help you shape this concept. What should I call you?"

**Step 2: Purpose (If 'Purpose' is missing)**
- **Condition:** The **Name** is present, but **Purpose** is missing.
- **Action:** Address the user by name and confirm their initial idea (\`${sanitizedFirstUserMessage}\`). Your primary task is to help them define the project's purpose. To do this, you MUST **generate 2-3 highly relevant, specific examples** of what that purpose could be, based directly on their stated idea.
- **Example of how to structure your question:** "It's great to meet you, [User's Name]! I'm excited to help you map this out. You mentioned you want to build a '[User's Idea]', so to start, let's define its core purpose. Based on that idea, are you thinking of something like [Generated Example A], [Generated Example B], or perhaps something else entirely? What is the main goal?"

**Step 3: Region (If 'Region' is missing)**
- **Condition:** The **Purpose** is present, but **Region** is missing.
- **Action:** Acknowledge their purpose and ask where they plan to launch the service.
- **Example:** "That's a great direction. Now let's talk about the region where you plan to launch. Are you focusing on a specific city, country, or a wider global market?"

**Step 4: Platform (If 'Platform' is missing)**
- **Condition:** The **Region** is present, but **Platform** is missing.
- **Action:** Ask if they are considering a mobile app, web app, or both.
- **Example:** "Great. Let's discuss the platform. Are you considering a mobile app, a web application, or perhaps both?"

**--- NEW STEP 4.5 ---**
**Step 4.5: Platform Specifics (If 'Platform' is 'mobile app' or 'both' but OS is not specified)**
- **Condition:** The **Platform** value is 'mobile app' or 'both', AND it does not already contain the words 'iOS' or 'Android'.
- **Action:** Ask for clarification on which mobile platforms they are targeting.
- **Example:** "Got it. For the mobile app component, are you targeting iOS, Android, or both platforms?"

**Step 5: Email (If 'Email' is missing)**
- **Condition:** The **Platform** is fully specified, but **Email** is missing.
- **Action:** Ask for their email address, making it clear it's optional.
- **Example:** "Excellent, that gives us a clear picture of the technical foundation. Before we talk budget, would you like to provide an email so I can send you the final summary? No problem at all if not."

**Step 6: Budget (If 'Budget' is missing)**
- **Condition:** The **Budget** is missing, AND either **Email** is present OR the user's last message indicates they declined to provide an email.
- **Action:** Ask for an approximate budget.
- **Example:** "Understood. Just one last question before we get to the exciting part. Do you have an approximate budget in mind for the initial version of this project?"

**Step 7: Feature Suggestions (Budget-Aware)**
- **Condition:** All previous fields, including **Budget**, are present.
- **Action:** Your primary task is to generate a realistic number of features based on the user's provided budget. You MUST follow these budget tiers strictly:
    - **Tier 1 (Micro Budget: under $1,000):** If the budget is less than $1,000, state that the budget is very limited but a great starting point. Generate **only 2-4 essential, core features**.
    - **Tier 2 (Standard Budget: $1,000 - $15,000):** If the budget is in this range, generate **5-8 relevant features**.
    - **Tier 3 (Large Budget: over $15,000):** If the budget is over $15,000, you can suggest a more comprehensive list of **10-15 features**.
- **Example Closing Statement:** "Thank you for all the information! Based on your budget and project goals, I've drafted an initial set of features for your review in the 'User Requirements' panel."

### CURRENT REQUIREMENTS
This is the data you must analyze and update in every response.
\`\`\`
${currentRequirementsState}
\`\`\`

${finalInstruction}
`.trim(),
        };

        const safeMessages = messages.slice(-MAX_MESSAGES);

        const openAIResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [systemInstruction, ...safeMessages],
        });

        const aiMessage = openAIResponse.choices[0].message;
        
        const newAIMessageObject = {
            role: 'assistant',
            content: aiMessage.content,
        };

        let finalUpdatedRequirements = { ...existingRequirements }; 
        const dataBlockStartIndex = findDataBlockStart(aiMessage.content);

        if (dataBlockStartIndex !== -1) {
            const requirementsText = aiMessage.content.substring(dataBlockStartIndex);
            const newlyParsedRequirements = parseRequirements(requirementsText);
            finalUpdatedRequirements = mergeRequirements(existingRequirements, newlyParsedRequirements);
        }

        const updatedMessagesForDB = [...messages, newAIMessageObject];

        await setDoc(sessionRef, {
            userId: userId,
            messages: updatedMessagesForDB,
            requirements: finalUpdatedRequirements,
            lastUpdated: new Date(),
        }, { merge: true });

        const apiResponse = NextResponse.json({
            updatedMessages: updatedMessagesForDB,
            updatedRequirements: finalUpdatedRequirements,
            newSessionId: newSessionId,
            proposalOffered: proposalOffered,
        });

        if (isNewUser) {
            apiResponse.cookies.set('userId', userId, { path: '/', httpOnly: true, maxAge: 365 * 24 * 60 * 60, sameSite: 'lax' });
        }

        return apiResponse;
    } catch (error) {
        console.error('❌ Error in API route:', error);
        if (error instanceof TypeError && error.message.includes('circular structure')) {
            console.error("Serialization Error: A circular reference was detected. Check the objects being sent to NextResponse.json().");
        }
        return NextResponse.json({ error: "API Error" }, { status: 500 });
    }
}