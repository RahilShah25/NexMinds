import { supabase, isSupabaseConfigured } from './supabaseClient';
import { shuffleQuestionOptions } from './studyToolsAI';

/**
 * Curated Seed Questions (matching supabase_schema.sql)
 * 32 comprehensive questions across Math, Pattern/Puzzle, Logic, and Memory
 */
export const SEED_QUESTIONS = [
  // ── MATH / QUANTITATIVE ──────────────────────────────────────────
  {
    category: 'math',
    question: 'A car travels 120 km in 2 hours. What is its average speed?',
    options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'],
    answer_index: 1,
    explanation: 'Speed = Distance ÷ Time = 120 km ÷ 2 h = 60 km/h.',
    difficulty: 'easy',
  },
  {
    category: 'math',
    question: 'What is 15% of 240 calculated mentally?',
    options: ['32', '36', '40', '48'],
    answer_index: 1,
    explanation: '10% of 240 = 24. 5% = 12. Sum: 24 + 12 = 36.',
    difficulty: 'easy',
  },
  {
    category: 'math',
    question: '5 workers finish a job in 8 days. How long will 10 workers take?',
    options: ['6 days', '4 days', '3 days', '5 days'],
    answer_index: 1,
    explanation: 'Total work = 5 × 8 = 40 man-days. 10 workers take 40 ÷ 10 = 4 days.',
    difficulty: 'medium',
  },
  {
    category: 'math',
    question: 'A 200 m train moves at 54 km/h. How much time will it take to cross a pole?',
    options: ['10 sec', '12 sec', '13.3 sec', '15 sec'],
    answer_index: 2,
    explanation: '54 km/h = 54 × (5/18) = 15 m/s. Time = 200 ÷ 15 ≈ 13.3 sec.',
    difficulty: 'medium',
  },
  {
    category: 'math',
    question: 'Goods marked 25% above cost price are sold at a 10% discount. What is the profit %?',
    options: ['10%', '12.5%', '15%', '20%'],
    answer_index: 1,
    explanation: 'SP = 1.25 × 0.9 × CP = 1.125 CP → 12.5% net profit.',
    difficulty: 'medium',
  },
  {
    category: 'math',
    question: 'If the ratio of A:B is 3:5 and B:C is 2:3, what is A:C?',
    options: ['3:5', '2:5', '6:15', '1:2'],
    answer_index: 1,
    explanation: 'A/C = (3/5) × (2/3) = 6/15 = 2/5.',
    difficulty: 'medium',
  },
  {
    category: 'math',
    question: 'The average of 5 consecutive integers is 24. What is the largest integer?',
    options: ['24', '25', '26', '28'],
    answer_index: 2,
    explanation: 'Consecutive numbers centered around 24 are 22, 23, 24, 25, 26. Largest is 26.',
    difficulty: 'medium',
  },
  {
    category: 'math',
    question: 'A sum triples itself in 8 years at simple interest. What is the annual interest rate?',
    options: ['20%', '25%', '15%', '12.5%'],
    answer_index: 1,
    explanation: 'Simple Interest = 2P in 8 years. Rate = (2P × 100) / (P × 8) = 25%.',
    difficulty: 'hard',
  },

  // ── PUZZLE / PATTERN ─────────────────────────────────────────────
  {
    category: 'puzzle',
    question: 'What comes next in the geometric progression: 2, 4, 8, 16, __ ?',
    options: ['24', '28', '32', '36'],
    answer_index: 2,
    explanation: 'Each number doubles the previous term: 16 × 2 = 32.',
    difficulty: 'easy',
  },
  {
    category: 'puzzle',
    question: 'Find the missing number: 1, 4, 9, 16, 25, __ ?',
    options: ['30', '35', '36', '40'],
    answer_index: 2,
    explanation: 'Consecutive squares: 1², 2², 3², 4², 5², 6² = 36.',
    difficulty: 'easy',
  },
  {
    category: 'puzzle',
    question: 'Which value fills the blank: 3, 6, 11, 18, 27, __ ?',
    options: ['36', '38', '40', '35'],
    answer_index: 1,
    explanation: 'Differences are odd primes: +3, +5, +7, +9, +11 → 27 + 11 = 38.',
    difficulty: 'medium',
  },
  {
    category: 'puzzle',
    question: 'Letter series: A, C, F, J, O, __ ?',
    options: ['T', 'U', 'V', 'W'],
    answer_index: 1,
    explanation: 'Gaps increase by 1: +2, +3, +4, +5, +6 → O(15) + 6 = U(21).',
    difficulty: 'medium',
  },
  {
    category: 'puzzle',
    question: 'Find the odd one out: 4, 8, 12, 15, 16',
    options: ['4', '8', '12', '15'],
    answer_index: 3,
    explanation: '15 is not a multiple of 4; all others are divisible by 4.',
    difficulty: 'easy',
  },
  {
    category: 'puzzle',
    question: 'What comes next in the Fibonacci sequence: 1, 1, 2, 3, 5, 8, __ ?',
    options: ['11', '12', '13', '15'],
    answer_index: 2,
    explanation: 'Sum of preceding two terms: 5 + 8 = 13.',
    difficulty: 'easy',
  },
  {
    category: 'puzzle',
    question: 'Find the missing letter in pattern: B, E, H, K, __ ?',
    options: ['M', 'N', 'O', 'P'],
    answer_index: 1,
    explanation: 'Positions skip by +3: 2, 5, 8, 11, 14 (N).',
    difficulty: 'medium',
  },
  {
    category: 'puzzle',
    question: 'Which is the odd one out: 27, 64, 125, 144, 216?',
    options: ['27', '64', '144', '216'],
    answer_index: 2,
    explanation: '144 is 12² (square), whereas 27, 64, 125, 216 are all perfect cubes (3³, 4³, 5³, 6³).',
    difficulty: 'hard',
  },

  // ── LOGIC / LOGICAL REASONING ────────────────────────────────────
  {
    category: 'logic',
    question: 'All cats are animals. Some animals are pets.\nConclusion: "Some cats are pets" is:',
    options: ['Definitely True', 'Definitely False', 'Cannot be determined', 'Always False'],
    answer_index: 2,
    explanation: 'The pet subset may not intersect with the feline subset. We cannot logically conclude.',
    difficulty: 'medium',
  },
  {
    category: 'logic',
    question: 'If A > B and B > C, then how does A relate to C?',
    options: ['A < C', 'A = C', 'A > C', 'Cannot say'],
    answer_index: 2,
    explanation: 'By the transitive property of inequality, A > B > C implies A > C.',
    difficulty: 'easy',
  },
  {
    category: 'logic',
    question: 'Ram is taller than Shyam. Mohan is shorter than Shyam. Who is the tallest?',
    options: ['Shyam', 'Mohan', 'Ram', 'Cannot say'],
    answer_index: 2,
    explanation: 'Ordering: Ram > Shyam > Mohan → Ram is the tallest.',
    difficulty: 'easy',
  },
  {
    category: 'logic',
    question: 'All roses are flowers. Some flowers are red.\nConclusion: "Some roses are red" is:',
    options: ['True', 'Maybe True', 'False', 'Cannot be determined'],
    answer_index: 3,
    explanation: 'Red flowers may or may not include roses — cannot be concluded with certainty.',
    difficulty: 'medium',
  },
  {
    category: 'logic',
    question: 'P is the father of Q. Q is sister of R. What is P to R?',
    options: ['Uncle', 'Brother', 'Father', 'Grandfather'],
    answer_index: 2,
    explanation: 'P is the father of Q, and Q and R are siblings, so P is father of R.',
    difficulty: 'easy',
  },
  {
    category: 'logic',
    question: 'Pointing to a photograph, Rohit says: "She is daughter of my grandfather\'s only son." Who is she?',
    options: ['Sister', 'Mother', 'Aunt', 'Daughter'],
    answer_index: 0,
    explanation: 'Grandfather\'s only son is Rohit\'s father. The daughter of Rohit\'s father is his sister.',
    difficulty: 'medium',
  },
  {
    category: 'logic',
    question: 'If South-East becomes North and North-East becomes West, what will West become?',
    options: ['South-East', 'South-West', 'North-West', 'East'],
    answer_index: 0,
    explanation: 'Each cardinal direction shifts 135° clockwise. West shifted 135° clockwise points South-East.',
    difficulty: 'hard',
  },
  {
    category: 'logic',
    question: 'Statements: No birds are dogs. All dogs are quadrupeds.\nConclusion: "No birds are quadrupeds" is:',
    options: ['Definitely True', 'Definitely False', 'Cannot be determined', 'Always True'],
    answer_index: 2,
    explanation: 'Birds cannot be dogs, but they could still potentially be in the quadrupeds category.',
    difficulty: 'hard',
  },

  // ── MEMORY / NUMERICAL AGILITY ───────────────────────────────────
  {
    category: 'memory',
    question: 'What is the next prime number after 13?',
    options: ['15', '16', '17', '19'],
    answer_index: 2,
    explanation: '14 = 2×7, 15 = 3×5, 16 = 2⁴. 17 has no positive divisors other than 1 and itself.',
    difficulty: 'easy',
  },
  {
    category: 'memory',
    question: 'What is the square root of 2025?',
    options: ['40', '42', '45', '50'],
    answer_index: 2,
    explanation: '45 × 45 = 2025 (4 × 5 = 20, 5 × 5 = 25).',
    difficulty: 'medium',
  },
  {
    category: 'memory',
    question: 'If 3x + 7 = 22, what is the value of x?',
    options: ['4', '5', '6', '3'],
    answer_index: 1,
    explanation: '3x = 22 - 7 = 15 → x = 15 ÷ 3 = 5.',
    difficulty: 'easy',
  },
  {
    category: 'memory',
    question: 'What is the LCM of 4, 6 and 8?',
    options: ['16', '24', '48', '12'],
    answer_index: 1,
    explanation: 'Multiples of 8: 8, 16, 24. 24 is divisible by both 4 and 6. LCM is 24.',
    difficulty: 'easy',
  },
  {
    category: 'memory',
    question: 'Calculate mentally: 256 × 0.25 = ?',
    options: ['54', '60', '64', '68'],
    answer_index: 2,
    explanation: 'Multiplying by 0.25 is equivalent to dividing by 4: 256 ÷ 4 = 64.',
    difficulty: 'easy',
  },
  {
    category: 'memory',
    question: 'What is 18% of 50?',
    options: ['9', '8', '10', '12'],
    answer_index: 0,
    explanation: 'Percentage is reversible: 18% of 50 = 50% of 18 = 9.',
    difficulty: 'medium',
  },
  {
    category: 'memory',
    question: 'If 2^x = 128, what is x?',
    options: ['5', '6', '7', '8'],
    answer_index: 2,
    explanation: '2⁵ = 32, 2⁶ = 64, 2⁷ = 128. So x = 7.',
    difficulty: 'medium',
  },
  {
    category: 'memory',
    question: 'What is the cube of 12 (12³)?',
    options: ['1440', '1728', '1688', '1824'],
    answer_index: 1,
    explanation: '12 × 12 = 144, and 144 × 12 = 1728.',
    difficulty: 'hard',
  },
];

/**
 * Resolve category aliases to valid database categories
 */
export function getCategoryAliases(cat = 'math') {
  const c = (cat || 'math').toLowerCase();
  if (c === 'math' || c === 'quantitative') return ['math', 'quantitative'];
  if (c === 'puzzle' || c === 'pattern') return ['puzzle', 'pattern'];
  if (c === 'logic' || c === 'logical') return ['logic', 'logical'];
  if (c === 'memory' || c === 'numerical') return ['memory', 'numerical'];
  if (c === 'all') return ['math', 'puzzle', 'logic', 'memory', 'quantitative', 'pattern', 'logical', 'numerical'];
  return [c];
}

/**
 * Normalizes question object across schema variants
 */
function normalizeQuestionRow(row, fallbackCat) {
  let opts = [];
  if (Array.isArray(row.options)) {
    opts = row.options;
  } else if (typeof row.options === 'string') {
    try {
      opts = JSON.parse(row.options);
    } catch {
      opts = row.options.split(',').map((s) => s.trim());
    }
  }

  const ansIndex = typeof row.answer_index === 'number'
    ? row.answer_index
    : (typeof row.answer === 'number' ? row.answer : 0);

  return {
    id: row.id || `db-${Math.random().toString(36).substring(2, 9)}`,
    q: row.question || row.q || 'Aptitude Question',
    options: opts,
    answer: ansIndex,
    explanation: row.explanation || '',
    difficulty: row.difficulty || 'medium',
    category: row.category || fallbackCat,
    isFromDb: true,
  };
}

/**
 * Get static fallback questions when Supabase is offline
 */
export function getStaticFallbackQuestions(cat = 'math', count = 5) {
  const aliases = getCategoryAliases(cat);
  let pool = SEED_QUESTIONS.filter((q) => aliases.includes(q.category));
  if (pool.length === 0) pool = SEED_QUESTIONS;

  const normalized = pool.map((q, idx) => ({
    id: `static-${q.category}-${idx}`,
    q: q.question,
    options: [...q.options],
    answer: q.answer_index,
    explanation: q.explanation,
    difficulty: q.difficulty,
    category: q.category,
    isFromDb: false,
  }));

  const shuffled = shuffleQuestionOptions([...normalized].sort(() => 0.5 - Math.random()));
  return typeof count === 'number' ? shuffled.slice(0, count) : shuffled;
}

/**
 * Primary fetch function: Loads questions from Supabase Database
 * Supports category filtering, question count, and auto-seeding if table is empty.
 */
export async function fetchAptitudeQuestions({
  category = 'math',
  count = 5,
  difficulty = null,
} = {}) {
  // If Supabase is not configured, fall back immediately to static bank
  if (!isSupabaseConfigured()) {
    console.info('[QuestionsService] Supabase not configured in env, using offline question bank');
    const fallback = getStaticFallbackQuestions(category, count);
    return { questions: fallback, isFromDb: false, totalInDb: 0 };
  }

  try {
    const validCats = getCategoryAliases(category);
    let query = supabase.from('questions').select('*');

    if (category !== 'all') {
      query = query.in('category', validCats);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    // Fetch up to 100 questions from DB
    const { data, error } = await query.limit(100);

    if (error) {
      console.warn('[QuestionsService] Supabase query notice:', error.message);
      const fallback = getStaticFallbackQuestions(category, count);
      return { questions: fallback, isFromDb: false, totalInDb: 0 };
    }

    // If table exists but has 0 questions, auto-seed default questions
    if (!data || data.length === 0) {
      console.log('[QuestionsService] Table empty, seeding questions to Supabase...');
      try {
        await supabase.from('questions').upsert(SEED_QUESTIONS, { onConflict: 'category,question' });
      } catch (seedErr) {
        console.warn('[QuestionsService] Auto-seed warning:', seedErr.message);
      }
      const fallback = getStaticFallbackQuestions(category, count);
      return { questions: fallback, isFromDb: true, totalInDb: SEED_QUESTIONS.length };
    }

    // Normalize rows
    const validRows = data
      .map((row) => normalizeQuestionRow(row, category))
      .filter((q) => q.q && Array.isArray(q.options) && q.options.length >= 2);

    if (validRows.length === 0) {
      const fallback = getStaticFallbackQuestions(category, count);
      return { questions: fallback, isFromDb: false, totalInDb: 0 };
    }

    // Randomize question sequence
    const shuffledRows = [...validRows].sort(() => 0.5 - Math.random());

    // Slice to requested count unless count === 'all'
    const targetSlice = typeof count === 'number' && count > 0
      ? shuffledRows.slice(0, count)
      : shuffledRows;

    // Shuffle options so correct answers are balanced across A, B, C, D
    const balancedQuestions = shuffleQuestionOptions(targetSlice);

    return {
      questions: balancedQuestions,
      isFromDb: true,
      totalInDb: data.length,
    };
  } catch (err) {
    console.error('[QuestionsService] Exception fetching from Supabase:', err);
    const fallback = getStaticFallbackQuestions(category, count);
    return { questions: fallback, isFromDb: false, totalInDb: 0 };
  }
}
