export const LANGUAGE_MAPPINGS = {
    'cpp': { language: 'cpp17', versionIndex: '0' },
    'c++': { language: 'cpp17', versionIndex: '0' },
    'python': { language: 'python3', versionIndex: '4' },
    'python3': { language: 'python3', versionIndex: '4' },
    'java': { language: 'java', versionIndex: '4' },
    'javascript': { language: 'nodejs', versionIndex: '4' },
    'nodejs': { language: 'nodejs', versionIndex: '4' },
    'c': { language: 'c', versionIndex: '4' },
    'csharp': { language: 'csharp', versionIndex: '4' },
    'php': { language: 'php', versionIndex: '4' },
    'ruby': { language: 'ruby', versionIndex: '4' },
    'go': { language: 'go', versionIndex: '4' },
    'rust': { language: 'rust', versionIndex: '4' },
    'swift': { language: 'swift', versionIndex: '4' }
};

export const getJDoodleLanguage = (lang) => {
    const defaultMapping = { language: 'nodejs', versionIndex: '4' };
    if (!lang) return defaultMapping;

    // Normalize language string
    const normalized = lang.toLowerCase().trim();
    return LANGUAGE_MAPPINGS[normalized] || defaultMapping;
};
