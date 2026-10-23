// Localized engine explanations. IDs are language-neutral.
export const messages={
  "decision.feedback": "Record conversational feedback without changing world truth or personal factual evidence.",
  "decision.known-viewpoints": "Report only viewpoints this character has encountered; distinguish them from the character’s own position and from universal agreement.",
  "decision.compare-evidence": "Compare matching facets using this character’s evidence on each side; leave missing information unknown.",
  "decision.known-members": "List the category members this character knows, without claiming an exhaustive census.",
  "decision.provisional-testimony": "Use testimony provisionally, preserving attribution.",
  "decision.retain-confirmed": "Record testimony separately; retain confirmed evidence.",
  "decision.select-evidence": "Select personal evidence matching the query; preserve source and uncertainty.",
  "decision.unknown": "No matching personal evidence; acknowledge the knowledge boundary.",
  "decision.clarify": "Preserve ambiguity instead of inventing an interpretation.",
  "decision.social": "Handle a social conversational act.",
  "decision.confirm-reference": "Check the actual preceding factual response for the named referent.",
  "decision.knowledge-boundary": "Describe the knowledge boundary without inventing evidence.",
  "decision.qualify-testimony": "Attach a source qualification to testimony; do not negate the reported event.",
  "decision.set-topic": "Accept an explicit correction of the topic.",
  "decision.sequence": "Interpret and respond to each speech act in order; keep social disclosure distinct from factual testimony.",
  "decision.recall-report": "Recall the actual attributed report, without inventing or promoting testimony.",
  "decision.missing-proposition": "Ask which proposition is to be checked.",
  "decision.verify": "Check a specific proposition against personal confirmed or inferred evidence; absence of evidence stays unknown.",
  "decision.repair": "Acknowledge an unrecognized turn in character without claiming to understand it.",
  "decision.social-memory": "Respond to a social act; retain conversational memory separately from factual evidence."
};
