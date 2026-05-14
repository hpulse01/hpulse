/**
 * P4.8 — Taiyi 积年 + 局数 + 主客算 计算 (基础, partial).
 *
 * 注: 太乙神数全本含 阳九 / 百六 / 三纪 / 五元 / 计神 / 大游 / 小游 等大量子项，
 * 本版仅实现 积年 → 局数 → 太乙宫 / 文昌 / 始击 / 主客算 这条主干，标 partial。
 */
import type { TaiyiInput, TaiyiChart, ExplanationStep, TaiyiWarning, PalaceNumber } from './types';
import { PALACE_META, LOOP_ORDER, DEFAULT_EPOCH_YEAR, YANG_DUN_LIMIT, TOTAL_JU } from './constants';

function gregorianYearFromUtc(utcIso: string, tz: string): number {
  const utc = new Date(utcIso);
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric' });
  return Number(fmt.formatToParts(utc).find((p) => p.type === 'year')?.value ?? utc.getUTCFullYear());
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

  // 文昌: 简化为 太乙宫 + 4 (LOOP_ORDER 顺向).
  const wenChangPalace = loopAdvance(taiyiPalace, 4, 1);
  trace.push({
    rule: 'taiyi.wenChang',
    detail: `文昌 (简化) = 太乙宫顺行 4 步 = ${wenChangPalace}宫。完整文昌算法 (含计神交宫) 标 partial。`,
    data: { wenChangPalace },
  });

  // 始击: 简化为 文昌对宫 (顺 4 步).
  const shiJiPalace = loopAdvance(wenChangPalace, 4, 1);
  trace.push({
    rule: 'taiyi.shiJi',
    detail: `始击 (简化) = 文昌对宫 = ${shiJiPalace}宫。`,
    data: { shiJiPalace },
  });
  warnings.push({
    code: 'taiyi.wenChang.shiJi.partial',
    message: '文昌、始击的传统算法 (含计神 / 大游小游 / 君基臣基民基 / 大客小客) 未完整实现，本版采用 LOOP_ORDER 简化映射。',
    level: 'warn',
  });

  // 主算 / 客算: 简化 = 太乙宫五行 vs 始击宫五行 → 数值化 1..9 对比.
  const zhuSuan = taiyiPalace; // 主算 = 太乙宫数 (示意)
  const keSuan = shiJiPalace;  // 客算 = 始击宫数 (示意)
  const zhuKeJudgment: TaiyiChart['zhuKeJudgment'] =
    zhuSuan === keSuan ? '平' : (zhuSuan > keSuan ? '主胜' : '客胜');
  trace.push({
    rule: 'taiyi.zhuKe',
    detail: `主算=${zhuSuan} (太乙宫)，客算=${keSuan} (始击宫) → ${zhuKeJudgment}。完整主客算 (大将主大将客 / 参将 / 定算) 标 partial。`,
    data: { zhuSuan, keSuan, judgment: zhuKeJudgment },
  });

  return {
    input,
    scale,
    jiNian,
    yuanIndex,
    juNumber,
    dunDirection,
    taiyiPalace,
    wenChangPalace,
    shiJiPalace,
    zhuSuan,
    keSuan,
    zhuKeJudgment,
    confidence: 50,
    completenessScore: 0.45,
    sourceGrade: 'D',
    implementationStatus: 'partial',
    warnings,
    explanationTrace: trace,
  };
}
