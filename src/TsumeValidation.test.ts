import { TSUME_PROBLEMS } from './models/TsumeProblem';
import { findMate, createTsumeState, validateProblem } from './utils/TsumeLogic';

describe('Tsume problem validation', () => {
  TSUME_PROBLEMS.forEach(p => {
    test(`${p.id} ${p.title} is solvable in ${p.moves} moves`, () => {
      const state = createTsumeState(p);
      const firstMove = findMate(state, p.moves);
      if (!firstMove) {
        // Print debug info
        console.log('FAILED:', p.id, JSON.stringify({ hands: p.hands }));
      }
      expect(firstMove).not.toBeNull();
      expect(validateProblem(p)).toBe(true);
    });
  });
});
