// ===== 2. SIMPLE MODEL ANALYZER =====
// modelAnalyzer.js - Basic Qlik field extraction (connects to Qlik app)
export async function getQlikFields(app) {
  try {
    console.log("Getting Qlik fields...");

    // Try to get field list from Qlik app using official API
    let fields = [];
    try {
      // Call Qlik's built-in method to get all fields in the data model
      const fieldList = await app.getList("FieldList");
      fields = fieldList.qFieldList?.qItems || []; // Extract the field array
    } catch (error) {
      // If Qlik API fails (demo mode), use mock data instead
      console.warn("Using mock fields for demo");
      fields = createMockFields();
    }

    // Simple categorization - split fields into dimensions vs measures
    // Dimensions = text fields (names, categories) / Measures = number fields (times, scores)
    const dimensions = fields
      .filter((f) => !f.qIsNumeric)
      .map((f) => ({
        name: f.qName, // Field name (e.g., "athlete_name")
        type: "dimension", // Mark as dimension for Qlik
      }));

    const measures = fields
      .filter((f) => f.qIsNumeric)
      .map((f) => ({
        name: f.qName, // Field name (e.g., "race_time")
        type: "measure", // Mark as measure for Qlik
      }));

    console.log(
      "Found fields:",
      dimensions.length,
      "dimensions,",
      measures.length,
      "measures"
    );

    // Return organized field structure for Smart Matcher
    return {
      dimensions, // Text-based fields
      measures, // Number-based fields
      all: [...dimensions, ...measures], // Combined list for matching
    };
  } catch (error) {
    // Fallback to mock data if everything fails
    console.warn("Using mock fields:", error);
    return {
      dimensions: createMockFields().filter((f) => !f.qIsNumeric),
      measures: createMockFields().filter((f) => f.qIsNumeric),
      all: createMockFields(),
    };
  }
}

// Create demo fields when Qlik connection isn't available
function createMockFields() {
  return [
    // Swimming-specific field examples with proper typing
    { qName: "name", qIsNumeric: false }, // Athlete names (text)
    { qName: "athlete", qIsNumeric: false }, // Alternative athlete field
    { qName: "team", qIsNumeric: false }, // Team names (text)
    { qName: "event", qIsNumeric: false }, // Event names like "100m freestyle"
    { qName: "heat", qIsNumeric: false }, // Heat numbers/names
    { qName: "lane", qIsNumeric: false }, // Lane assignments
    { qName: "time", qIsNumeric: true }, // Race times (numeric)
    { qName: "place", qIsNumeric: true }, // Finishing position (numeric)
    { qName: "reaction_time", qIsNumeric: true }, // Start reaction time (numeric)
    { qName: "distance", qIsNumeric: true }, // Race distance (numeric)
  ];
}
