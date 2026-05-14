import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper function to call OpenRouter AI API
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string>} The AI's response text
 */
async function getAIResponse(prompt) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'openai/gpt-oss-120b:free',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })
    });

    if (response.status === 429) {
        const error = new Error('AI service is busy, please try again in a moment');
        error.status = 429;
        throw error;
    }

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenRouter');
    }

    return data.choices[0].message.content;
}

/**
 * POST /api/ai/review
 * Reviews code for bugs, performance, best practices, and suggestions
 */
router.post('/review', authMiddleware, async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code || !language) {
            return res.status(400).json({ error: 'code and language are required fields' });
        }

        const prompt = `You are a senior code reviewer. Review this ${language} code and provide:
1. Bugs — errors or broken logic
2. Performance issues — slow or inefficient code
3. Best practices — clean code violations
4. Suggestions — specific improvements
Keep response concise, structured and developer friendly.

Code to review:
\`\`\`${language}
${code}
\`\`\``;

        const responseText = await getAIResponse(prompt);
        return res.json({ review: responseText });

    } catch (error) {
        console.error('AI Review Error:', error.message);
        if (error.status === 429) {
            return res.status(429).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Failed to generate code review' });
    }
});

/**
 * POST /api/ai/fix
 * Fixes broken code and explains what was wrong
 */
router.post('/fix', authMiddleware, async (req, res) => {
    try {
        const { code, language, error } = req.body;

        if (!code || !language || !error) {
            return res.status(400).json({ error: 'code, language, and error are required fields' });
        }

        const prompt = `You are an expert ${language} developer.
The following code has this error: ${error}
Fix the code and briefly explain what was wrong.
Return the fixed code first, then the explanation.

Code to fix:
\`\`\`${language}
${code}
\`\`\``;

        const responseText = await getAIResponse(prompt);
        return res.json({ fix: responseText });

    } catch (err) {
        console.error('AI Fix Error:', err.message);
        if (err.status === 429) {
            return res.status(429).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Failed to fix code' });
    }
});

/**
 * POST /api/ai/evaluate
 * Evaluates a completed coding problem
 */
router.post('/evaluate', authMiddleware, async (req, res) => {
    try {
        const { code, language, problem, timeTaken } = req.body;

        if (!code || !language || !problem || timeTaken === undefined) {
            return res.status(400).json({ error: 'code, language, problem, and timeTaken are required fields' });
        }

        const prompt = `You are a technical interviewer. Evaluate this solution:
Problem: ${problem}
Language: ${language}
Time taken: ${timeTaken} minutes
Code: 
\`\`\`${language}
${code}
\`\`\`

Provide:
1. Correctness score out of 10
2. Code quality score out of 10
3. Time complexity analysis
4. What was done well
5. What to improve
6. Final recommendation: Hire / Maybe / No Hire`;

        const responseText = await getAIResponse(prompt);
        return res.json({ evaluation: responseText });

    } catch (err) {
        console.error('AI Evaluate Error:', err.message);
        if (err.status === 429) {
            return res.status(429).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Failed to evaluate code' });
    }
});

export default router;