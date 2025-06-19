/**
 * mappingEngine.js - Intelligent Column Mapping Engine
 *
 * Analyzes uploaded file columns and Qlik fields to suggest optimal mappings
 * using fuzzy matching, data type analysis, and domain-specific patterns.
 */

/**
 * Generate intelligent mapping suggestions between file columns and Qlik fields
 * @param {Array} fileColumns - Analyzed columns from uploaded file
 * @param {Array} qlikFields - Available Qlik fields from model analysis
 * @returns {Object} - Mapping suggestions with confidence scores
 */
export function generateMappingSuggestions(fileColumns, qlikFields) {
  try {
    console.log("Generating intelligent mappings...", {
      fileColumns: fileColumns.length,
      qlikFields: qlikFields.length,
    });

    const mappingSuggestions = {};

    fileColumns.forEach((fileCol) => {
      const suggestions = findBestMatches(fileCol, qlikFields);

      if (suggestions.length > 0) {
        const bestMatch = suggestions[0];

        mappingSuggestions[fileCol.name] = {
          qlikField: bestMatch.field,
          confidence: bestMatch.confidence,
          matchType: bestMatch.matchType,
          alternatives: suggestions.slice(1, 4), // Top 3 alternatives
          reason: bestMatch.reason,
        };
      } else {
        // No good matches found
        mappingSuggestions[fileCol.name] = {
          qlikField: null,
          confidence: 0,
          matchType: "no_match",
          alternatives: [],
          reason: "No suitable Qlik field found",
        };
      }
    });

    console.log(
      "Mapping suggestions generated:",
      Object.keys(mappingSuggestions).length
    );
    return mappingSuggestions;
  } catch (error) {
    console.error("Failed to generate mappings:", error);
    return {};
  }
}

/**
 * Find best matching Qlik fields for a file column
 */
function findBestMatches(fileColumn, qlikFields) {
  const matches = [];

  qlikFields.forEach((qlikField) => {
    const matchResult = calculateMatchScore(fileColumn, qlikField);

    if (matchResult.confidence > 0.1) {
      // Only include matches with some confidence
      matches.push({
        field: qlikField,
        confidence: matchResult.confidence,
        matchType: matchResult.matchType,
        reason: matchResult.reason,
      });
    }
  });

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Calculate match score between file column and Qlik field
 */
function calculateMatchScore(fileColumn, qlikField) {
  let confidence = 0;
  let matchType = "none";
  let reason = "";

  // 1. Exact name match (highest priority)
  if (fileColumn.name.toLowerCase() === qlikField.name.toLowerCase()) {
    confidence = 1.0;
    matchType = "exact_name";
    reason = "Exact name match";
    return { confidence, matchType, reason };
  }

  // 2. Fuzzy name matching
  const nameScore = calculateFuzzyMatch(fileColumn.name, qlikField.name);
  if (nameScore > 0.8) {
    confidence = nameScore * 0.9; // Slight penalty for not being exact
    matchType = "fuzzy_name";
    reason = `Strong name similarity (${Math.round(nameScore * 100)}%)`;
  }

  // 3. Swimming domain-specific matching
  const swimmingScore = calculateSwimmingDomainMatch(fileColumn, qlikField);
  if (swimmingScore > confidence) {
    confidence = swimmingScore;
    matchType = "domain_specific";
    reason = "Swimming domain pattern match";
  }

  // 4. Data type compatibility
  const typeScore = calculateTypeCompatibility(fileColumn, qlikField);
  confidence *= typeScore; // Multiply by type compatibility (0-1)

  if (typeScore < 0.5) {
    reason += " (data type mismatch)";
  }

  // 5. Contextual boosting for common patterns
  const contextBoost = calculateContextualBoost(fileColumn, qlikField);
  confidence *= 1 + contextBoost;

  // 6. Swimming relevance boost
  if (qlikField.swimmingRelevance && qlikField.swimmingRelevance > 5) {
    confidence *= 1.1; // 10% boost for swimming-relevant fields
  }

  // Ensure confidence doesn't exceed 1.0
  confidence = Math.min(confidence, 1.0);

  return { confidence, matchType, reason };
}

/**
 * Calculate fuzzy string matching score using simple algorithm
 */
function calculateFuzzyMatch(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1.0;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Calculate Levenshtein distance ratio
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = 1 - distance / maxLength;

  return Math.max(0, similarity);
}

/**
 * Simple Levenshtein distance calculation
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate swimming domain-specific matching score
 */
function calculateSwimmingDomainMatch(fileColumn, qlikField) {
  const swimmingMappings = {
    // Athlete identification
    name: ["athlete_name", "swimmer_name", "participant", "name", "athlete"],
    athlete: ["name", "swimmer", "participant", "athlete_name"],
    swimmer: ["name", "athlete", "participant", "swimmer_name"],

    // Performance metrics
    time: ["race_time", "finish_time", "final_time", "time", "duration"],
    reaction_time: ["start_time", "reaction", "rt", "reaction_time"],
    lap_time: ["split_time", "lap", "intermediate_time", "lap_time"],

    // Competition structure
    heat: ["heat_number", "heat", "session", "round"],
    lane: ["lane_number", "lane", "position"],
    place: ["rank", "position", "place", "finish_position"],

    // Event details
    event: ["event_name", "race", "competition_event", "event"],
    distance: ["race_distance", "event_distance", "distance", "length"],
    stroke: ["stroke_type", "style", "stroke", "swimming_style"],

    // Team and organization
    team: ["team_name", "club", "organization", "team"],
    country: ["nation", "country", "nationality", "country_code"],

    // Competition info
    competition: ["meet", "championship", "competition_name", "meet_name"],
    venue: ["pool", "facility", "location", "venue"],
  };

  const fileColLower = fileColumn.name.toLowerCase();
  const qlikFieldLower = qlikField.name.toLowerCase();

  let bestScore = 0;

  // Check if file column matches any swimming pattern
  Object.entries(swimmingMappings).forEach(([pattern, qlikAlternatives]) => {
    if (fileColLower.includes(pattern)) {
      // Check if Qlik field matches any alternative for this pattern
      qlikAlternatives.forEach((alternative) => {
        if (qlikFieldLower.includes(alternative)) {
          const score = 0.9; // High confidence for domain matches
          bestScore = Math.max(bestScore, score);
        }
      });
    }
  });

  return bestScore;
}

/**
 * Calculate data type compatibility score
 */
function calculateTypeCompatibility(fileColumn, qlikField) {
  const fileType = fileColumn.type;
  const qlikType = qlikField.type;

  // Perfect type matches
  if (fileType === qlikType) {
    return 1.0;
  }

  // Compatible type combinations
  const compatibleTypes = {
    numeric: ["numeric", "mixed_numeric", "time"],
    time: ["numeric", "text", "time"],
    date: ["text", "date", "timestamp"],
    text: ["text", "categorical", "date"],
    categorical: ["text", "categorical"],
  };

  if (
    compatibleTypes[fileType] &&
    compatibleTypes[fileType].includes(qlikType)
  ) {
    return 0.8;
  }

  // Partial compatibility
  if (
    (fileType === "mixed_numeric" && qlikType === "text") ||
    (fileType === "text" && qlikType === "numeric")
  ) {
    return 0.6;
  }

  return 0.4; // Low compatibility but not impossible
}

/**
 * Calculate contextual boost based on field relationships
 */
function calculateContextualBoost(fileColumn, qlikField) {
  let boost = 0;

  // Boost for fields that commonly appear together in swimming data
  const contextualRelationships = {
    time: ["event", "distance", "stroke"],
    place: ["heat", "lane", "time"],
    name: ["team", "country", "age"],
    heat: ["lane", "event", "session"],
    event: ["distance", "stroke", "gender"],
  };

  const fileColLower = fileColumn.name.toLowerCase();

  Object.entries(contextualRelationships).forEach(([key, relatedFields]) => {
    if (fileColLower.includes(key)) {
      relatedFields.forEach((related) => {
        if (qlikField.name.toLowerCase().includes(related)) {
          boost += 0.1;
        }
      });
    }
  });

  return Math.min(boost, 0.3); // Cap boost at 30%
}

/**
 * Validate and refine mapping suggestions
 */
export function validateMappingSuggestions(
  suggestions,
  fileColumns,
  qlikFields
) {
  const validatedSuggestions = { ...suggestions };
  const usedQlikFields = new Set();

  // Ensure no Qlik field is mapped multiple times (prefer higher confidence)
  const sortedMappings = Object.entries(suggestions)
    .filter(([, suggestion]) => suggestion.qlikField)
    .sort(([, a], [, b]) => b.confidence - a.confidence);

  sortedMappings.forEach(([fileCol, suggestion]) => {
    const qlikFieldName = suggestion.qlikField.name;

    if (usedQlikFields.has(qlikFieldName)) {
      // Find alternative mapping
      const alternatives = suggestion.alternatives.filter(
        (alt) => !usedQlikFields.has(alt.field.name)
      );

      if (alternatives.length > 0) {
        validatedSuggestions[fileCol] = {
          ...suggestion,
          qlikField: alternatives[0].field,
          confidence: alternatives[0].confidence * 0.9, // Slight penalty
          reason: `Alternative match (primary was taken)`,
        };
        usedQlikFields.add(alternatives[0].field.name);
      } else {
        // No alternatives, remove mapping
        validatedSuggestions[fileCol] = {
          ...suggestion,
          qlikField: null,
          confidence: 0,
          reason: "Field already mapped to another column",
        };
      }
    } else {
      usedQlikFields.add(qlikFieldName);
    }
  });

  return validatedSuggestions;
}

/**
 * Generate mapping summary for user review
 */
export function generateMappingSummary(suggestions) {
  const summary = {
    totalColumns: Object.keys(suggestions).length,
    mappedColumns: 0,
    unmappedColumns: 0,
    highConfidenceColumns: 0,
    mediumConfidenceColumns: 0,
    lowConfidenceColumns: 0,
    averageConfidence: 0,
  };

  let totalConfidence = 0;

  Object.values(suggestions).forEach((suggestion) => {
    if (suggestion.qlikField) {
      summary.mappedColumns++;
      totalConfidence += suggestion.confidence;

      if (suggestion.confidence > 0.8) {
        summary.highConfidenceColumns++;
      } else if (suggestion.confidence > 0.5) {
        summary.mediumConfidenceColumns++;
      } else {
        summary.lowConfidenceColumns++;
      }
    } else {
      summary.unmappedColumns++;
    }
  });

  summary.averageConfidence =
    summary.mappedColumns > 0 ? totalConfidence / summary.mappedColumns : 0;

  return summary;
}
