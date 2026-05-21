import axios from 'axios';
import { getJDoodleLanguage } from '../utils/jdoodle.js';

export const executeCode = async (req, res) => {
    try {
        const { script, sourceCode, language, stdin = '', input } = req.body;
        const codeToRun = script || sourceCode;
        const inputToRun = stdin || input || '';

        if (!codeToRun) {
            return res.status(400).json({ error: 'Source code is required' });
        }

        const jdoodleMapping = getJDoodleLanguage(language);

        const clientId = process.env.JDOODLE_CLIENT_ID;
        const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

        if (!clientId || !clientSecret || clientId === 'your_client_id_here' || clientSecret === 'your_client_secret_here') {
            return res.status(500).json({ error: 'JDoodle API credentials are not configured.' });
        }

        const payload = {
            clientId,
            clientSecret,
            script: codeToRun,
            language: jdoodleMapping.language,
            versionIndex: jdoodleMapping.versionIndex,
            stdin: inputToRun
        };

        const response = await axios.post('https://api.jdoodle.com/v1/execute', payload);

        // JDoodle responds with structure like:
        // { output: "...", statusCode: 200, memory: "...", cpuTime: "..." }

        // Let's standardise the response somewhat similar to expected execute outputs map
        res.json({
            output: response.data.output,
            statusCode: response.data.statusCode,
            memory: response.data.memory,
            cpuTime: response.data.cpuTime
        });

    } catch (error) {
        console.error('Error executing code:', error?.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to execute code',
            details: error?.response?.data?.error || error.message
        });
    }
};
