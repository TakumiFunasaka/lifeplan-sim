import { Child } from './types';
import {
  EDUCATION_ANNUAL_COST,
  EDUCATION_STAGES,
  UNIVERSITY_LIVING_ALONE_COST,
  CURRENT_YEAR,
} from './constants';

/**
 * ある年(西暦)における、1人の子供の教育費を計算
 */
export function calcChildEducationCost(child: Child, year: number): {
  cost: number;
  stage: string;
} {
  const childAge = year - child.birthYear;
  if (childAge < 0) return { cost: 0, stage: '' };

  let totalCost = 0;
  let currentStage = '';

  for (const stage of EDUCATION_STAGES) {
    const stageStart = stage.startOffset;
    const stageEnd = stage.startOffset + stage.duration;

    if (childAge >= stageStart && childAge < stageEnd) {
      const pathChoice = child.educationPath[stage.key];
      const costs = EDUCATION_ANNUAL_COST[stage.key];
      if (costs && pathChoice) {
        totalCost += costs[pathChoice] || 0;
        currentStage = stage.key;
      }

      // 大学で一人暮らしの場合
      if (stage.key === 'university' && child.educationPath.universityLiving === 'alone') {
        totalCost += UNIVERSITY_LIVING_ALONE_COST;
      }
    }
  }

  // 習い事(22歳まで)
  if (childAge >= 3 && childAge < 22) {
    totalCost += child.extracurricular * 12;
  }

  return { cost: totalCost, stage: currentStage };
}

/**
 * ある年における全子供の教育費合計
 */
export function calcTotalEducationCost(
  children: Child[],
  year: number
): { total: number; details: { childIndex: number; cost: number; stage: string }[] } {
  const details = children.map((child, i) => {
    const { cost, stage } = calcChildEducationCost(child, year);
    return { childIndex: i, cost, stage };
  });
  const total = details.reduce((sum, d) => sum + d.cost, 0);
  return { total, details };
}
