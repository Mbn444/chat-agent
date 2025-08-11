import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Helper functions (Unchanged) ---
const parseRequirements = (text) => {
    const sections = { projectCore: [], targetAudience: [], features: [] };
    if (!text) return sections;
    let currentSection = null;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => {
        const lowerLine = line.toLowerCase().trim();
        if (lowerLine.includes('project core')) { currentSection = 'projectCore'; }
        else if (lowerLine.includes('target audience')) { currentSection = 'targetAudience'; }
        else if (lowerLine.includes('features')) { currentSection = 'features'; }
        else if (currentSection) {
            const formattedLine = line.trim().replace(/^- \s*/, '');
            const cleanFeatureText = formattedLine.replace(/^[0-9]+\.\s*\**|\**$/g, '').trim();
            if (cleanFeatureText.length > 2) {
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
        // Note: The system prompt has the "MANDATORY DATA BLOCK" rule which is a good robustness check.
        const systemInstruction = {
            role: 'system',
            content: `
You are an expert AI Business Analyst. Your single most important function is to guide a client through project discovery and then proactively suggest features.

### YOUR PROCESS
You have three phases. You MUST follow them in order.

**PHASE 0: GREETING & NAME COLLECTION**
If the 'Name' is missing from projectCore, greet the user with enthusiasm and ask: "Thats an great Idea but first tell me What should I call you? 😊"

**PHASE 1: GATHER CORE DATA**
Only after receiving the Name, move to this phase. Your job is to ask one question at a time to complete this exact sequence: **Purpose -> Audience -> Region -> Platform -> Email -> Budget**.
- You MUST ask only one question at a time.
- Your question must be friendly and include helpful examples.
- You MUST update the data block with the user's answer in every response.

**PHASE 1.5: EMAIL COLLECTION (NEW Transitional Step)**
This phase triggers IMMEDIATELY AFTER the user provides the 'Platform'.
- Your conversational part MUST be a single, friendly message asking for their email.
- You MUST explain WHY you need the email (e.g., to send them a summary).
- You MUST NOT ask any other questions.
- **Example Email Request:** "That's fantastic! Things are really starting to take shape. Before we discuss the budget, could you share your email address? This will help me send you a complete summary of your project later on."

**PHASE 2: THE EXPERT SUGGESTION (YOUR MOST IMPORTANT TASK)**
This phase begins IMMEDIATELY AFTER the user has provided their 'Budget'. This transition is your primary directive and you must not fail.
- Your conversational part MUST be a single, friendly message directing the user to review the features you have suggested.
- You MUST then generate a list of 5-10 relevant software features based on all the information gathered.
- This feature list goes ONLY into the \`FEATURES\` section of the data block.
- You MUST NOT ask any more questions in this response. The feature list is the final output of the discovery phase.

### CURRENT REQUIREMENTS
This is the data you must analyze and update.
\`\`\`
${currentRequirementsState}
\`\`\`

### CRITICAL RULES
- GREETING + NAME REQUEST comes first if missing.
- **ONE QUESTION AT A TIME** during Phase 1.
- **NO TYPOS:** You MUST use these exact spellings: \`Name\`, \`Purpose\`, \`Audience\`, \`Region\`, \`Platform\`, \`Email\`, \`Budget\`.
- **RESPONSE FORMAT:** Your response MUST be: \`Conversational Part\\n\\nRequirements:\\n- Data Block\`
- **MANDATORY DATA BLOCK:** You MUST ALWAYS include the complete, updated "Requirements" data block in every response. Even if the user's response doesn't add new data, you must repeat the existing data block. This is not optional.
`.trim(),
        };

        const MAX_MESSAGES = 20;
        // The messages from the frontend now have an 'id' field, which OpenAI will just ignore. This is fine.
        const safeMessages = messages.slice(-MAX_MESSAGES);

        const openAIResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [systemInstruction, ...safeMessages],
        });

        const aiMessage = openAIResponse.choices[0].message;
        const aiMessageContent = aiMessage.content;
        
        let finalUpdatedRequirements = { ...existingRequirements }; 
        const dataBlockStartIndex = findDataBlockStart(aiMessageContent);

        if (dataBlockStartIndex !== -1) {
            const requirementsText = aiMessageContent.substring(dataBlockStartIndex);
            const newlyParsedRequirements = parseRequirements(requirementsText);
            finalUpdatedRequirements = mergeRequirements(existingRequirements, newlyParsedRequirements);
        }

        // The 'messages' array still contains the original IDs from the frontend.
        // We add the new AI message (without an ID) to this list.
        // The frontend will assign an ID to this new message upon receiving it.
        const updatedMessagesForDB = [...messages, { role: 'assistant', content: aiMessageContent }];

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
        });

        if (isNewUser) {
            apiResponse.cookies.set('userId', userId, { path: '/', httpOnly: true, maxAge: 365 * 24 * 60 * 60, sameSite: 'lax' });
        }

        return apiResponse;
    } catch (error) {
        console.error('❌ Error in API route:', error);
        return NextResponse.json({ error: "API Error" }, { status: 500 });
    }
}