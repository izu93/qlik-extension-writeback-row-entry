// ===== 3. THE SMART MATCHER ENGINE - FIXED DUPLICATES =====
// mappingEngine.js - Core matching logic with duplicate prevention
export function generateSmartMappings(fileColumns, qlikFields) {
  console.log("Smart Matcher starting...");
  console.log(
    "File columns:",
    fileColumns.map((c) => c.name)
  );
  console.log(
    "Qlik fields:",
    qlikFields.map((f) => f.name)
  );

  const mappings = {};
  const usedQlikFields = new Set(); // Track used Qlik fields to prevent duplicates

  // Sort file columns by priority (exact matches first)
  const sortedFileColumns = [...fileColumns].sort((a, b) => {
    const aExact = qlikFields.some(
      (q) => q.name.toLowerCase() === a.name.toLowerCase()
    );
    const bExact = qlikFields.some(
      (q) => q.name.toLowerCase() === b.name.toLowerCase()
    );
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });

  // Loop through each column in the uploaded file
  sortedFileColumns.forEach((fileCol) => {
    // Find the best available Qlik field match for this file column
    const bestMatch = findBestMatch(fileCol, qlikFields, usedQlikFields);

    // Only keep matches with decent confidence (30% minimum)
    if (bestMatch && bestMatch.confidence > 0.3) {
      // Store the mapping with all the match details
      mappings[fileCol.name] = {
        qlikField: bestMatch.field,
        confidence: bestMatch.confidence,
        matchType: bestMatch.type,
        reason: bestMatch.reason,
      };

      // Mark this Qlik field as used to prevent duplicates
      usedQlikFields.add(bestMatch.field.name);

      // Log successful mapping
      console.log(
        `${fileCol.name} → ${bestMatch.field.name} (${Math.round(
          bestMatch.confidence * 100
        )}%)`
      );
    } else {
      // Log failed mapping attempt
      console.log(`No good match for: ${fileCol.name}`);
    }
  });

  console.log(
    "Smart Matcher complete:",
    Object.keys(mappings).length,
    "mappings"
  );
  return mappings;
}

// Core matching function - tries each file column against available Qlik fields
function findBestMatch(fileColumn, qlikFields, usedQlikFields) {
  let bestMatch = null;
  let bestScore = 0;

  // Test this file column against every AVAILABLE Qlik field
  qlikFields.forEach((qlikField) => {
    // Skip if this Qlik field is already used
    if (usedQlikFields.has(qlikField.name)) {
      return;
    }

    // Calculate match score using our 4 strategies
    const score = calculateMatchScore(fileColumn, qlikField);

    // If this is the best match so far, remember it
    if (score.confidence > bestScore) {
      bestScore = score.confidence;
      bestMatch = {
        field: qlikField,
        confidence: score.confidence,
        type: score.type,
        reason: score.reason,
      };
    }
  });

  return bestMatch;
}

// The 4 Core Matching Strategies - THIS IS THE SMART PART
function calculateMatchScore(fileColumn, qlikField) {
  // Convert both names to lowercase for easier comparison
  const fileName = fileColumn.name.toLowerCase();
  const qlikName = qlikField.name.toLowerCase();

  // Strategy 1: Exact Match (100% confidence)
  // "name" === "name" - perfect match!
  if (fileName === qlikName) {
    return {
      confidence: 1.0,
      type: "exact",
      reason: "Exact name match",
    };
  }

  // Strategy 2: Contains Match (80% confidence)
  // "athlete_name" contains "name" - very likely match
  if (fileName.includes(qlikName) || qlikName.includes(fileName)) {
    return {
      confidence: 0.8,
      type: "contains",
      reason: "Name contains match",
    };
  }

  // Strategy 3: Swimming Domain Knowledge (70% confidence)
  // Use sport-specific knowledge: "swimmer" should map to "name"
  const domainScore = checkSwimmingDomain(fileName, qlikName);
  if (domainScore > 0) {
    return {
      confidence: domainScore,
      type: "domain",
      reason: "Swimming domain match",
    };
  }

  // Strategy 4: Fuzzy Match (50-60% confidence)
  // Handle typos: "athelete" is similar to "athlete"
  const fuzzyScore = calculateFuzzyMatch(fileName, qlikName);
  if (fuzzyScore > 0.5) {
    return {
      confidence: fuzzyScore,
      type: "fuzzy",
      reason: "Fuzzy name similarity",
    };
  }

  // No good match found
  return { confidence: 0, type: "none", reason: "No match found" };
}

// Swimming domain knowledge - sport-specific mappings (IMPROVED)
function checkSwimmingDomain(fileName, qlikName) {
  // Define swimming-specific field relationships with priority
  const swimmingMaps = {
    // Exact field mappings first
    name: ["name", "athlete", "swimmer"],
    reaction_time: ["reaction_time"], // Only exact match for reaction_time
    time: ["time", "duration", "result"],
    lap_time: ["lap_time", "split_time"], // lap_time should NOT map to "time"
    place: ["place", "rank", "position"],
    event: ["event", "race", "competition"],
    team: ["team", "club", "country"],
    heat: ["heat", "round", "session"],
    lane: ["lane", "position"],
    distance: ["distance", "length", "meters"],
    competition: ["competition", "meet", "tournament"], // competition should NOT map to reaction_time
  };

  // Check if file column name matches any swimming patterns
  for (const [filePattern, qlikPatterns] of Object.entries(swimmingMaps)) {
    if (fileName.includes(filePattern)) {
      for (const qlikPattern of qlikPatterns) {
        if (qlikName.includes(qlikPattern)) {
          // Special case: prefer exact matches for time-related fields
          if (
            filePattern === "reaction_time" &&
            qlikPattern === "reaction_time"
          ) {
            return 0.95; // Very high confidence for exact reaction_time match
          }
          if (filePattern === "time" && qlikPattern === "time") {
            return 0.95; // Very high confidence for exact time match
          }
          if (filePattern === "lap_time" && qlikPattern === "lap_time") {
            return 0.95; // Very high confidence for exact lap_time match
          }

          return 0.7; // 70% confidence for other domain matches
        }
      }
    }
  }

  return 0; // No domain knowledge match found
}

// Simple fuzzy matching - handles typos and slight differences
function calculateFuzzyMatch(str1, str2) {
  // Identify longer and shorter string
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  // Handle edge case
  if (longer.length === 0) return 1.0;

  // Count how many characters from shorter string appear in longer string
  let commonChars = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      commonChars++;
    }
  }

  // Return ratio of matching characters to total characters
  return commonChars / longer.length;
}
