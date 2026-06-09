/**
 * P4.7+ — 奇门高级规则：天盘干转换、十干克应格局、三诈五假、伏吟反吟。
 *
 * 全部为确定性表查找，无随机、无系统时间。
 */
import type {
  DunDirection, PalaceNumber, SanQiLiuYi, GateName, DeityName,
  PalaceCell, ExplanationStep, QimenPattern, FuYinFanYinInfo,
} from './types';
import { LOOP_ORDER } from './constants';

/** 天盘干转换：天盘随值符旋转，与九星同步移位；中宫干寄留。 */
export function rotateHeavenStems(
  layout: Record<PalaceNumber, SanQiLiuYi>,
  shift: number,
  dun: DunDirection,
  trace: ExplanationStep[],
): Record<PalaceNumber, SanQiLiuYi | null> {
  const out: Partial<Record<PalaceNumber, SanQiLiuYi | null>> = {};
  out[5] = layout[5] ?? null;
  const dir = dun === 'yang' ? 1 : -1;
  for (let i = 0; i < 8; i++) {
    const srcPalace = LOOP_ORDER[i];
    const stem = layout[srcPalace] ?? null;
    const newIdx = (i + dir * shift + 800) % 8;
    const dstPalace = LOOP_ORDER[newIdx];
    out[dstPalace] = stem;
  }
  trace.push({
    rule: 'qimen.heavenStemRotation',
    detail: `天盘干随值符${dun === 'yang' ? '顺' : '逆'}移 ${shift} 步（与九星同步），中宫干寄留。`,
    data: { shift, dunDirection: dun, heavenStemAtPalace: out },
  });
  return out as Record<PalaceNumber, SanQiLiuYi | null>;
}

const AUSPICIOUS_GATES: GateName[] = ['开门', '休门', '生门'];
const SAN_QI: SanQiLiuYi[] = ['乙', '丙', '丁'];

/** 十干克应（天盘干 + 地盘干）经典格局表。 */
const STEM_PAIR_PATTERNS: Record<string, { name: string; type: '吉格' | '凶格'; impact: number; description: string }> = {
  '戊丙': { name: '青龙返首', type: '吉格', impact: 9, description: '天盘戊临地盘丙，为事大吉，谋为皆遂' },
  '丙戊': { name: '飞鸟跌穴', type: '吉格', impact: 9, description: '天盘丙临地盘戊，百事洞彻，事半功倍' },
  '乙辛': { name: '青龙逃走', type: '凶格', impact: -7, description: '天盘乙临地盘辛，人亡财破，奴仆拐带' },
  '辛乙': { name: '白虎猖狂', type: '凶格', impact: -7, description: '天盘辛临地盘乙，家败人伤，远行多殃' },
  '丁癸': { name: '朱雀投江', type: '凶格', impact: -6, description: '天盘丁临地盘癸，文书口舌俱消，音信沉溺' },
  '癸丁': { name: '螣蛇夭矫', type: '凶格', impact: -6, description: '天盘癸临地盘丁，文书官司，火焚也轻' },
  '庚丙': { name: '太白入荧', type: '凶格', impact: -5, description: '天盘庚临地盘丙，贼必来，宜防盗失' },
  '丙庚': { name: '荧入太白', type: '凶格', impact: -5, description: '天盘丙临地盘庚，贼即去，财物可追' },
};

/** 六仪击刑：六仪落入对应宫位为击刑。 */
const JI_XING_PALACE: Partial<Record<SanQiLiuYi, PalaceNumber>> = {
  '戊': 3, '己': 2, '庚': 8, '辛': 9, '壬': 4, '癸': 4,
};

/** 三奇入墓宫位（乙墓坤二、丙墓乾六、丁墓艮八）。 */
const QI_MU_PALACE: Partial<Record<SanQiLiuYi, PalaceNumber>> = {
  '乙': 2, '丙': 6, '丁': 8,
};

const ZHA_DEITY: Partial<Record<DeityName, string>> = {
  '太阴': '真诈', '六合': '休诈', '九地': '重诈',
};

/** 格局识别：十干克应 / 三奇得门 / 三诈五假 / 击刑入墓。 */
export function detectQimenPatterns(
  palaces: PalaceCell[],
  trace: ExplanationStep[],
): QimenPattern[] {
  const out: QimenPattern[] = [];
  const push = (name: string, type: QimenPattern['type'], palace: PalaceNumber, impact: number, description: string, evidence: string) => {
    out.push({ name, type, palace, impact, description, evidence });
  };

  for (const cell of palaces) {
    const h = cell.heavenStem;
    const e = cell.earthStem;
    // 十干克应
    if (h && e) {
      const pair = STEM_PAIR_PATTERNS[`${h}${e}`];
      if (pair) {
        push(pair.name, pair.type, cell.palace, pair.impact, pair.description, `天盘${h}+地盘${e}@${cell.palace}宫`);
      }
    }
    // 三奇得门
    if (h && SAN_QI.includes(h) && cell.gate && AUSPICIOUS_GATES.includes(cell.gate)) {
      push('三奇得门', '吉格', cell.palace, 7, `${h}奇会${cell.gate}，吉事可成`, `天盘${h}+${cell.gate}@${cell.palace}宫`);
      // 三诈：三奇 + 吉门 + 太阴/六合/九地
      const zha = cell.deity ? ZHA_DEITY[cell.deity] : undefined;
      if (zha) {
        push(zha, '吉格', cell.palace, 8, `三奇得吉门并临${cell.deity}，为${zha}格，宜谋为施诈`, `${h}+${cell.gate}+${cell.deity}@${cell.palace}宫`);
      }
    }
    // 天假：景门 + 三奇 + 九天
    if (h && SAN_QI.includes(h) && cell.gate === '景门' && cell.deity === '九天') {
      push('天假', '吉格', cell.palace, 5, '景门会三奇临九天，宜上书献策、求名进取', `${h}+景门+九天@${cell.palace}宫`);
    }
    // 六仪击刑
    if (h && JI_XING_PALACE[h] === cell.palace) {
      push('六仪击刑', '凶格', cell.palace, -6, `天盘${h}落${cell.palace}宫为击刑，诸事不利`, `${h}@${cell.palace}宫`);
    }
    // 三奇入墓
    if (h && QI_MU_PALACE[h] === cell.palace) {
      push('三奇入墓', '凶格', cell.palace, -5, `${h}奇入墓于${cell.palace}宫，奇仪受制，吉不能为吉`, `${h}@${cell.palace}宫`);
    }
  }

  trace.push({
    rule: 'qimen.patterns',
    detail: `格局识别完成：检出 ${out.length} 个格局（${out.map((p) => p.name).join('、') || '无'}）。`,
    data: { count: out.length, patterns: out.map((p) => ({ name: p.name, palace: p.palace, impact: p.impact })) },
  });
  return out;
}

/** 伏吟反吟判定：星盘移位 0 步为伏吟、4 步为反吟（转盘式）。 */
export function detectFuYinFanYin(
  starShift: number,
  trace: ExplanationStep[],
): FuYinFanYinInfo {
  const fuYin = starShift % 8 === 0;
  const fanYin = starShift % 8 === 4;
  const scoreAdjustment = (fuYin ? -5 : 0) + (fanYin ? -8 : 0);
  const description = fuYin
    ? '伏吟局：天盘与地盘重合，主事体停滞、宜静不宜动'
    : fanYin
      ? '反吟局：天盘与地盘对冲，主反复无常、事多变动'
      : '非伏吟反吟局';
  trace.push({
    rule: 'qimen.fuYinFanYin',
    detail: `${description}（移位=${starShift}，评分调整=${scoreAdjustment}）。`,
    data: { starShift, fuYin, fanYin, scoreAdjustment },
  });
  return { fuYin, fanYin, scoreAdjustment, description };
}
