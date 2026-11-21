import {
  ChoiceOption,
  ConceptMatchingQuestion,
  ConceptPair,
  ProcessSequenceQuestion,
  QuestionModel,
  SequenceStep,
  SingleChoiceQuestion,
} from '../types/game';

export function shuffleArray<T>(items: readonly T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export interface PreparedSingleChoice {
  kind: 'single';
  question: SingleChoiceQuestion;
  shuffledOptions: ChoiceOption[];
}

export interface PreparedConceptMatching {
  kind: 'matching';
  question: ConceptMatchingQuestion;
  shuffledTerms: Array<{ id: string; term: string }>;
  shuffledMatches: Array<{ id: string; match: string }>;
}

export interface PreparedProcessSequence {
  kind: 'sequence';
  question: ProcessSequenceQuestion;
  initialSteps: SequenceStep[];
}

export type PreparedQuestion =
  | PreparedSingleChoice
  | PreparedConceptMatching
  | PreparedProcessSequence;

export function prepareShuffledQuestion(q: QuestionModel): PreparedQuestion {
  if (q.type === 'concept_matching') {
    const terms = shuffleArray(q.pairs.map((p: ConceptPair) => ({ id: p.id, term: p.term })));
    let matches = shuffleArray(q.pairs.map((p: ConceptPair) => ({ id: p.id, match: p.match })));
    // Ensure matches are not trivially aligned 1-to-1 with terms when >= 2 pairs
    if (terms.length > 1 && matches.every((m, idx) => m.id === terms[idx].id)) {
      matches = [...matches.slice(1), matches[0]];
    }
    return {
      kind: 'matching',
      question: q,
      shuffledTerms: terms,
      shuffledMatches: matches,
    };
  }

  if (q.type === 'process_sequence') {
    const canonical = [...q.steps].sort((a, b) => a.order - b.order);
    let shuffled = shuffleArray(canonical);
    if (canonical.length > 1 && shuffled.every((s, idx) => s.id === canonical[idx].id)) {
      shuffled = [...shuffled.slice(1), shuffled[0]];
    }
    return {
      kind: 'sequence',
      question: q,
      initialSteps: shuffled,
    };
  }

  // Single choice variants (multiple_choice, true_false, case_study, cause_effect, statement_analysis)
  return {
    kind: 'single',
    question: q,
    shuffledOptions: shuffleArray(q.options),
  };
}

export function gradeQuestionResponse(
  q: QuestionModel,
  response:
    | { kind: 'single'; selectedOptionId: string }
    | { kind: 'matching'; mapping: Record<string, string> }
    | { kind: 'sequence'; orderedIds: string[] }
): boolean {
  if (q.type === 'concept_matching' && response.kind === 'matching') {
    return q.pairs.every((pair) => response.mapping[pair.id] === pair.id);
  }
  if (q.type === 'process_sequence' && response.kind === 'sequence') {
    const canonical = [...q.steps].sort((a, b) => a.order - b.order);
    if (response.orderedIds.length !== canonical.length) return false;
    return canonical.every((step, idx) => response.orderedIds[idx] === step.id);
  }
  if (
    q.type !== 'concept_matching' &&
    q.type !== 'process_sequence' &&
    response.kind === 'single'
  ) {
    return response.selectedOptionId === q.correctOptionId;
  }
  return false;
}
