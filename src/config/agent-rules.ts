import { IGusername } from '../secret';

export interface AgentRules {
    // Post content filtering
    allowedHashtags: string[];
    blockedHashtags: string[];
    allowedKeywords: string[];
    blockedKeywords: string[];
    
    // Interaction rules
    maxPostsPerSession: number;
    minFollowers: number;
    maxFollowers: number;
    interactionDelay: {
        min: number; // milliseconds
        max: number; // milliseconds
    };
    
    // User filtering
    allowedUserTypes: string[];
    blockedUsernames: string[];
    followedUsersOnly: boolean;
    
    // Comment rules
    commentStyle: string;
    commentTopics: string[];
    avoidTopics: string[];
    
    // Rate limiting
    maxLikesPerHour: number;
    maxCommentsPerHour: number;
    maxInteractionsPerUser: number;
}

// Default configuration
export const defaultAgentRules: AgentRules = {
    // Post content filtering
    allowedHashtags: ['realestate', 'business', 'entrepreneur', 'success', 'motivation'],
    blockedHashtags: ['nsfw', 'politics', 'controversy'],
    allowedKeywords: ['success', 'growth', 'business', 'development', 'innovation', 'listed', 'property', 'real estate', 'homes', 'buying', 'selling', 'investment'],
    blockedKeywords: ['spam', 'scam', 'fraud', 'adult'],
    
    // Interaction rules
    maxPostsPerSession: 20,
    minFollowers: 100,
    maxFollowers: 1000000,
    interactionDelay: {
        min: 5000,  // 5 seconds
        max: 15000  // 15 seconds
    },
    
    // User filtering
    allowedUserTypes: ['business', 'creator', 'personal'],
    blockedUsernames: [],
    followedUsersOnly: false,
    
    // Comment rules
    commentStyle: 'professional',
    commentTopics: [
        'business growth',
        'professional development',
        'industry insights',
        'networking',
        'success stories',
        'real estate market',
        'property investment',
        'market trends',
        'home buying tips',
        'real estate opportunities'
    ],
    avoidTopics: [
        'politics',
        'religion',
        'controversial topics',
        'personal issues'
    ],
    
    // Rate limiting
    maxLikesPerHour: 30,
    maxCommentsPerHour: 20,
    maxInteractionsPerUser: 2
};

// Helper functions
export function shouldInteractWithPost(caption: string, rules: AgentRules = defaultAgentRules): boolean {
    // Convert caption to lowercase for case-insensitive matching
    const lowerCaption = caption.toLowerCase();
    
    // Check for blocked keywords
    if (rules.blockedKeywords.some(keyword => lowerCaption.includes(keyword.toLowerCase()))) {
        return false;
    }
    
    // Check for blocked hashtags
    const hashtags = caption.match(/#\w+/g) || [];
    if (hashtags.some(tag => 
        rules.blockedHashtags.includes(tag.slice(1).toLowerCase())
    )) {
        return false;
    }
    
    // Check for allowed hashtags
    const hasAllowedHashtag = hashtags.some(tag => {
        const tagText = tag.slice(1).toLowerCase();
        return rules.allowedHashtags.some(allowed => tagText.includes(allowed));
    });
    
    // Check for allowed keywords with more flexible matching
    const hasAllowedKeyword = rules.allowedKeywords.some(keyword => {
        // Split keyword to handle multi-word keywords like "real estate"
        const keywordParts = keyword.toLowerCase().split(' ');
        return keywordParts.every(part => lowerCaption.includes(part));
    });
    
    // Check for real estate specific patterns
    const hasRealEstateIndicators = (
        /\$[\d,]+/.test(caption) || // Price mentions
        /sq\s*ft/i.test(caption) || // Square footage
        /bed|bath/i.test(caption) || // Bedroom/bathroom mentions
        /(?:just|new)\s+list(?:ed|ing)/i.test(caption) // Listing mentions
    );
    
    // Must have at least one allowed hashtag, keyword, or real estate indicator
    return hasAllowedHashtag || hasAllowedKeyword || hasRealEstateIndicators;
}

export function generateCommentPrompt(caption: string, rules: AgentRules = defaultAgentRules): string {
    return `
    Craft a thoughtful, engaging, and ${rules.commentStyle} reply to the following post: "${caption}".
    
    Focus on these topics: ${rules.commentTopics.join(', ')}.
    Avoid these topics: ${rules.avoidTopics.join(', ')}.
    
    Guidelines:
    - Keep it between 150-300 characters
    - Be relevant and insightful
    - Add value to the conversation
    - Maintain professionalism
    - Sound natural and human
    - Avoid generic responses
    - Don't use hashtags
    - Don't promote or sell anything
    - Don't ask to DM or follow
    
    Ensure the reply complies with Instagram Community Standards and avoids spam-like behavior.
    `.trim();
}
