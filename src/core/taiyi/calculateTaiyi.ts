/**
 * P4.8 — Taiyi 积年 + 局数 + 主客算 计算 (基础, partial).
 *
 * 注: 太乙神数全本含 阳九 / 百六 / 三纪 / 五元 / 计神 / 大游 / 小游 等大量子项，
 * 本版仅实现 积年 → 局数 → 太乙宫 / 文昌 / 始击 / 主客算 这条主干，标 partial。
 */
import type { TaiyiInput, TaiyiChart, ExplanationStep, TaiyiWarning, PalaceNumber } from './types';
import {
  PALACE_META, LOOP_ORDER, DEFAULT_EPOCH_YEAR, YANG_DUN_LIMIT, TOTAL_JU,
  BRANCHES_CN, JI_SHEN_MAP, BRANCH_PALACE, SIXTEEN_GODS,
} from './constants';
import type { BranchCN } from './constants';

function gregorianYearFromUtc(utcIso: string, tz: string): number {
  const utc = new Date(utcIso);
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric' });
  return Number(fmt.formatToParts(utc).find((p) => p.type === 'year')?.value ?? utc.getUTCFullYear());
}

/** 主/客算：自起算宫沿 LOOP_ORDER 顺行累加宫数，至太乙前一宫止 (中宫不计，遇太乙停)。 */
function countSuan(from: PalaceNumber, taiyi: PalaceNumber): number {
  const start = from === 5 ? 2 : from;
  const target = taiyi === 5 ? 2 : taiyi;
  let idx = LOOP_ORDER.indexOf(start as PalaceNumber);
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const p = LOOP_ORDER[((idx % 8) + 8) % 8];
    if (p === target) break;
    sum += p;
    idx += 1;
  }
  return sum === 0 ? start : sum;
}

function loopAdvance(p: PalaceNumber, steps: number, dir: 1 | -1): PalaceNumber {
  const start = p === 5 ? 2 : p; // 中宫寄2
  const idx = LOOP_ORDER.indexOf(start as PalaceNumber);
  const newIdx = ((idx + dir * steps) % 8 + 8) % 8;
  return LOOP_ORDER[newIdx];
}

export function calculateTaiyiChart(input: TaiyiInput): TaiyiChart {
  if (!input.queryTimeUtc || !input.timezoneIana) {
    throw new Error('Taiyi requires queryTimeUtc + timezoneIana');
  }
  const trace: ExplanationStep[] = [];
  const warnings: TaiyiWarning[] = [];
  const scale = input.scale ?? 'year';
  if (scale !== 'year') {
    warnings.push({
      code: 'taiyi.scale.partial',
      message: `scale=${scale} (月/日/时家太乙) 在本版未完整实现，回退到年家计算。`,
      level: 'warn',
    });
  }

  const epoch = input.epochYear ?? DEFAULT_EPOCH_YEAR;
  const year = gregorianYearFromUtc(input.queryTimeUtc, input.timezoneIana);
  const jiNian = year - epoch;
  if (jiNian <= 0) {
    warnings.push({
      code: 'taiyi.epoch.invalid',
      message: '积年 ≤ 0，请检查 epochYear。',
      level: 'error',
    });
  }
  trace.push({
    rule: 'taiyi.jiNian',
    detail: `太乙积年 = ${year} − (${epoch}) = ${jiNian}（epoch 可由 input.epochYear 覆盖）。`,
    data: { gregorianYear: year, epochYear: epoch, jiNian },
  });

  // 局数: ji_nian mod 72.
  const juNumber = ((jiNian - 1) % TOTAL_JU + TOTAL_JU) % TOTAL_JU + 1;
  const dunDirection: 'yang' | 'yin' = juNumber <= YANG_DUN_LIMIT ? 'yang' : 'yin';
  trace.push({
    rule: 'taiyi.juNumber',
    detail: `局数 = ((积年−1) mod 72)+1 = ${juNumber}；${juNumber <= YANG_DUN_LIMIT ? '阳遁' : '阴遁'}。`,
    data: { juNumber, dunDirection, yangLimit: YANG_DUN_LIMIT },
  });

  // 元数 (大周期 360 年作示意).
  const yuanIndex = ((jiNian - 1) % 360 + 360) % 360 + 1;
  trace.push({
    rule: 'taiyi.yuan',
    detail: `元位 = ((积年−1) mod 360)+1 = ${yuanIndex} (示意；高级三纪/五元未完整实现)。`,
    data: { yuanIndex },
  });

  // 太乙所在宫: 阳遁起 1 宫顺行 LOOP；阴遁起 9 宫逆行。简化：用 (juWithinDun) % 8.
  const dir: 1 | -1 = dunDirection === 'yang' ? 1 : -1;
  const juWithinDun = dunDirection === 'yang' ? juNumber - 1 : juNumber - YANG_DUN_LIMIT - 1;
  const taiyiPalace = loopAdvance(dunDirection === 'yang' ? 1 : 9, juWithinDun, dir);
  trace.push({
    rule: 'taiyi.taiyiPalace',
    detail: `太乙宫 = ${dunDirection === 'yang' ? '阳遁起1宫顺' : '阴遁起9宫逆'} 行 ${juWithinDun} 步 (LOOP_ORDER)，落 ${taiyiPalace}宫(${PALACE_META[taiyiPalace].trigram}/${PALACE_META[taiyiPalace].direction})。`,
    data: { dunDirection, juWithinDun, taiyiPalace },
  });

  // 年支与计神：计神以寅为首逆行十二辰。
  const yearBranch: BranchCN = BRANCHES_CN[(((year - 4) % 12) + 12) % 12];
  const jiShen: BranchCN = JI_SHEN_MAP[yearBranch];
  const jiShenGod = SIXTEEN_GODS.find((g) => g.position === jiShen)?.name ?? '地主';
  trace.push({
    rule: 'taiyi.jiShen',
    detail: `岁支=${yearBranch}，计神逆布落 ${jiShen} (十六神：${jiShenGod})。`,
    data: { yearBranch, jiShen, jiShenGod },
  });

  // 文昌 (天目): 太乙宫顺行 4 步 (LOOP_ORDER，简化起例)。
  const wenChangPalace = loopAdvance(taiyiPalace, 4, 1);
  trace.push({
    rule: 'taiyi.wenChang',
    detail: `文昌 = 太乙宫顺行 4 步 = ${wenChangPalace}宫 (简化起例)。`,
    data: { wenChangPalace },
  });

  // 始击: 计神所临之宫 (计神支 → 后天八卦宫)。
  const shiJiPalace = BRANCH_PALACE[jiShen];
  trace.push({
    rule: 'taiyi.shiJi',
    detail: `始击 = 计神 ${jiShen} 所临之宫 = ${shiJiPalace}宫。`,
    data: { shiJiPalace, jiShen },
  });
  warnings.push({
    code: 'taiyi.advanced.partial',
    message: '大游/小游、君基臣基民基、阳九百六等子项未实现；文昌采用简化起例。',
    level: 'warn',
  });

  // 主算/客算：自文昌/始击宫起累加宫数至太乙前一宫。
  const zhuSuan = countSuan(wenChangPalace, taiyiPalace);
  const keSuan = countSuan(shiJiPalace, taiyiPalace);
  const mod9 = (n: number) => (n % 9 === 0 ? 9 : n % 9);
  const zhuDaJiang = mod9(zhuSuan) as PalaceNumber;
  const keDaJiang = mod9(keSuan) as PalaceNumber;
  const zhuCanJiang = mod9(zhuDaJiang * 3) as PalaceNumber;
  const keCanJiang = mod9(keDaJiang * 3) as PalaceNumber;
  const zhuKeJudgment: TaiyiChart['zhuKeJudgment'] =
    zhuSuan === keSuan ? '平' : (zhuSuan > keSuan ? '主胜' : '客胜');
  trace.push({
    rule: 'taiyi.zhuKe',
    detail: `主算=${zhuSuan} (自文昌${wenChangPalace}宫起)，客算=${keSuan} (自始击${shiJiPalace}宫起) → ${zhuKeJudgment}；主大将${zhuDaJiang} 主参将${zhuCanJiang} 客大将${keDaJiang} 客参将${keCanJiang}。`,
    data: { zhuSuan, keSuan, judgment: zhuKeJudgment, zhuDaJiang, zhuCanJiang, keDaJiang, keCanJiang },
  });

  return {
    input,
    scale,
    jiNian,
    yuanIndex,
    juNumber,
    dunDirection,
    taiyiPalace,
    yearBranch,
    jiShen,
    jiShenGod,
    wenChangPalace,
    shiJiPalace,
    zhuSuan,
    keSuan,
    zhuDaJiang,
    zhuCanJiang,
    keDaJiang,
    keCanJiang,
    zhuKeJudgment,
    confidence: 58,
    completenessScore: 0.6,
    sourceGrade: 'C',
    implementationStatus: 'partial',
    warnings,
    explanationTrace: trace,
  };
}
