import express from 'express';
import authMiddleware from '../middleware/auth.js';
import supabase from '../lib/supabase.js';

const router = express.Router();

/**
 * Helper function to call OpenRouter AI API
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
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// POST /api/interview/start
router.post('/start', authMiddleware, async (req, res) => {
    try {
        const { roomId, problemStatement, durationMinutes } = req.body;

        if (!roomId || !problemStatement || !durationMinutes) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const hostId = req.user.id;

        // Insert new session
        const { data: session, error: insertError } = await supabase
            .from('interview_sessions')
            .insert([{
                room_id: roomId,
                host_id: hostId,
                problem_statement: problemStatement,
                duration_minutes: durationMinutes,
                status: 'active'
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Error creating interview session:', insertError);
            return res.status(500).json({ error: 'Failed to create session' });
        }

        // Update rooms table
        const { error: updateError } = await supabase
            .from('rooms')
            .update({ is_interview_mode: true })
            .eq('id', roomId);

        if (updateError) {
            console.error('Error updating room status:', updateError);
        }

        res.json({ session });
    } catch (error) {
        console.error('Start interview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/interview/end
router.post('/end', authMiddleware, async (req, res) => {
    try {
        const { sessionId, finalCode, language } = req.body;

        if (!sessionId || finalCode === undefined || !language) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Fetch session
        const { data: session, error: fetchError } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (fetchError || !session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Call AI evaluation but do not fail the end session if it rate-limits or fails
        let ai_evaluation = 'AI Evaluation is currently unavailable due to free-tier rate limits or model downtime. Please try again later.';
        try {
            const prompt = `You are a technical interviewer. Evaluate this solution:
Problem: ${session.problem_statement}
Language: ${language}
Code: ${finalCode}
Provide structured feedback with:
1. Correctness score out of 10
2. Code quality score out of 10  
3. Time complexity analysis
4. What was done well
5. What to improve
6. Final recommendation: Hire / Maybe / No Hire`;

            ai_evaluation = await getAIResponse(prompt);
        } catch (aiError) {
            console.error('AI Evaluation warning:', aiError.message);
        }

        // Update session
        const { data: updatedSession, error: updateError } = await supabase
            .from('interview_sessions')
            .update({
                final_code: finalCode,
                ai_evaluation: ai_evaluation,
                status: 'completed',
                ended_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({ error: 'Failed to complete session' });
        }

        // Update room
        await supabase
            .from('rooms')
            .update({ is_interview_mode: false })
            .eq('id', session.room_id);

        res.json({ session: updatedSession, evaluation: ai_evaluation });
    } catch (error) {
        console.error('End interview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/interview/:roomId
router.get('/:roomId', authMiddleware, async (req, res) => {
    try {
        const { roomId } = req.params;

        const { data: session, error } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('room_id', roomId)
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            return res.status(500).json({ error: 'Failed to fetch session' });
        }

        res.json(session || null);
    } catch (error) {
        console.error('Fetch interview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
