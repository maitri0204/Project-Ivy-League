import AgentSuggestion, { IAgentSuggestion } from '../models/ivy/AgentSuggestion';
import { PointerNo } from '../types/PointerNo';

/**
 * Normalize text for conceptual analysis
 * Deterministic: same input always produces same output
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract conceptual themes from student interest
 * Identifies key concepts, domains, and themes
 */
const extractThemes = (text: string): Set<string> => {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter((w) => w.length > 2);
  
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one',
    'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now',
    'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'she', 'use', 'her', 'many', 'than',
    'them', 'these', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when',
    'come', 'here', 'just', 'like', 'long', 'make', 'over', 'such', 'take', 'than',
    'them', 'well', 'were', 'what', 'with', 'your', 'from', 'they', 'know', 'want',
    'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just'
  ]);

  const meaningfulWords = words.filter((w) => !stopWords.has(w));
  return new Set(meaningfulWords);
};

/**
 * Extract domain-specific keywords
 * Maps common terms to conceptual domains
 */
const extractDomains = (text: string): Set<string> => {
  const normalized = normalizeText(text);
  const domains = new Set<string>();

  // Academic domains
  if (/\b(science|math|physics|chemistry|biology|engineering|research|academic|study|learn|education)\b/.test(normalized)) {
    domains.add('academic');
    domains.add('research');
  }

  // Arts/Literature domains
  if (/\b(art|music|dance|theater|creative|design|painting|drawing|performance|visual|literature|literary|writing|poetry|novel|author|book|story|essay|journalism|creative writing)\b/.test(normalized)) {
    domains.add('arts');
    domains.add('creative');
    domains.add('literature');
  }

  // Technology domains
  if (/\b(tech|computer|programming|coding|software|digital|ai|technology|code|app|website)\b/.test(normalized)) {
    domains.add('technology');
    domains.add('innovation');
  }

  // Social/Community domains
  if (/\b(social|community|help|volunteer|service|people|society|impact|change|support)\b/.test(normalized)) {
    domains.add('social');
    domains.add('community');
  }

  // Leadership domains
  if (/\b(lead|leadership|organize|team|manage|direct|coordinate|initiative|found|start)\b/.test(normalized)) {
    domains.add('leadership');
    domains.add('initiative');
  }

  // Sports/Athletics domains
  if (/\b(sport|athletic|team|competition|game|play|physical|fitness|exercise)\b/.test(normalized)) {
    domains.add('sports');
    domains.add('athletics');
  }

  // Business/Entrepreneurship/Finance domains
  if (/\b(business|entrepreneur|startup|company|enterprise|commerce|trade|market|sell|finance|financial|banking|investment|economics|economy|money|capital|stock|trading)\b/.test(normalized)) {
    domains.add('business');
    domains.add('entrepreneurship');
    domains.add('finance');
  }

  // Environmental domains
  if (/\b(environment|climate|nature|green|sustainable|ecology|planet|earth|conservation)\b/.test(normalized)) {
    domains.add('environment');
    domains.add('sustainability');
  }

  return domains;
};

/**
 * Determine if an activity is strategically suitable for Ivy League admissions
 * Based on conceptual relevance, not keyword matching
 */
const isStrategicallySuitable = (
  studentInterest: string,
  activity: IAgentSuggestion
): boolean => {
  const interestThemes = extractThemes(studentInterest);
  const interestDomains = extractDomains(studentInterest);

  // Combine activity content for analysis
  const activityText = `${activity.title} ${activity.description} ${activity.tags.join(' ')}`;
  const activityNormalized = normalizeText(activityText);
  const activityThemes = extractThemes(activityText);
  const activityDomains = extractDomains(activityText);

  // Conceptual relevance checks

  // 1. Domain overlap - if domains match, highly relevant
  const domainOverlap = [...interestDomains].filter((d) => activityDomains.has(d));
  if (domainOverlap.length > 0) {
    return true;
  }

  // 2. Theme overlap - if significant themes match
  const themeOverlap = [...interestThemes].filter((t) => activityThemes.has(t));
  if (themeOverlap.length >= 1) {
    return true;
  }

  // 3. Semantic context matching - check if activity context aligns with interest
  const interestWords = [...interestThemes];
  let contextMatchCount = 0;

  for (const word of interestWords) {
    // Check for exact word match
    if (word.length > 2 && activityNormalized.includes(word)) {
      contextMatchCount++;
    }
    // Also check for word stem matches (first 3-4 characters)
    else if (word.length > 3) {
      const wordStem = word.substring(0, Math.min(4, word.length));
      if (activityNormalized.includes(wordStem)) {
        contextMatchCount++;
      }
    }
  }

  // If context words match, it's relevant
  if (contextMatchCount >= 1) {
    return true;
  }

  // 4. Tag relevance - if activity tags contain interest themes
  const activityTagsText = activity.tags.join(' ').toLowerCase();
  for (const theme of interestThemes) {
    if (theme.length > 2 && activityTagsText.includes(theme)) {
      return true;
    }
    // Also check for partial matches in tags
    if (theme.length > 3) {
      const themeStem = theme.substring(0, Math.min(4, theme.length));
      if (activityTagsText.includes(themeStem)) {
        return true;
      }
    }
  }

  // 5. Description semantic match - check for conceptual alignment
  const descriptionWords = activity.description.toLowerCase().split(' ');
  const interestWordsArray = [...interestThemes];
  
  let semanticMatches = 0;
  for (const interestWord of interestWordsArray) {
    if (interestWord.length > 3) {
      // Check for word variations and related terms
      for (const descWord of descriptionWords) {
        if (descWord.length > 3) {
          // Simple similarity check (same prefix or contains)
          if (descWord.startsWith(interestWord.substring(0, 3)) || 
              interestWord.startsWith(descWord.substring(0, 3)) ||
              descWord.includes(interestWord) ||
              interestWord.includes(descWord)) {
            semanticMatches++;
            break;
          }
        }
      }
    }
  }

  if (semanticMatches >= 1) {
    return true;
  }

  // 6. Title word match - check if any interest word appears in title
  const titleNormalized = normalizeText(activity.title);
  for (const theme of interestThemes) {
    if (theme.length > 2 && titleNormalized.includes(theme)) {
      return true;
    }
  }

  // 7. If student interest is very short (single word), be more lenient
  // Return activity if it has any thematic connection
  if (interestThemes.size <= 2) {
    // For very specific interests, include activities that might be related
    // Check if activity description contains any related concepts
    const descriptionLower = activity.description.toLowerCase();
    for (const theme of interestThemes) {
      if (theme.length > 3) {
        // Check for partial matches or related terms
        if (descriptionLower.includes(theme) || 
            descriptionLower.includes(theme.substring(0, 3))) {
          return true;
        }
      }
    }
  }

  // If no clear conceptual match found, exclude the activity
  // Only return activities that have strategic relevance for Ivy League admissions
  return false;
};

/**
 * Agent Suggestion Engine
 * Returns ALL strategically suitable activities based on conceptual interpretation
 * 
 * @param studentInterest - Student's primary interest text
 * @param pointerNo - Pointer number (2, 3, or 4)
 * @returns Array of all suitable activities (not ranked, no scores)
 */
export const getAgentSuggestions = async (
  studentInterest: string,
  pointerNo: PointerNo.SpikeInOneArea | PointerNo.LeadershipInitiative | PointerNo.GlobalSocialImpact
): Promise<IAgentSuggestion[]> => {
  // Validate pointerNo
  if (
    pointerNo !== PointerNo.SpikeInOneArea &&
    pointerNo !== PointerNo.LeadershipInitiative &&
    pointerNo !== PointerNo.GlobalSocialImpact
  ) {
    throw new Error('Invalid pointerNo. Only 2, 3, or 4 are allowed.');
  }

  // Validate studentInterest
  if (!studentInterest || typeof studentInterest !== 'string' || studentInterest.trim().length === 0) {
    throw new Error('studentInterest is required and must be a non-empty string');
  }

  // Fetch all suggestions for this pointer from database
  const allSuggestions = await AgentSuggestion.find({ pointerNo }).exec();

  if (allSuggestions.length === 0) {
    return [];
  }

  // Filter activities based on conceptual relevance and admissions strategy
  const suitableActivities = allSuggestions.filter((activity) =>
    isStrategicallySuitable(studentInterest, activity)
  );

  // Sort deterministically by title for consistent output
  suitableActivities.sort((a, b) => a.title.localeCompare(b.title));

  // Return ALL suitable activities (no ranking, no scores)
  // Only return activities that actually match the student interest conceptually
  return suitableActivities;
};
