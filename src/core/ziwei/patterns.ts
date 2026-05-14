/**
 * P4.4 — 紫微格局检测.
 */

import type { ExplanationStep } from '../astro-time/types';
import type { ZiweiPalace, ZiweiPattern, SihuaInfo } from './types';

function starsIn(palace: ZiweiPalace | undefined): Set<string> {
  return new Set((palace?.stars ?? []).map(s => s.name));
}

function bright(palace: ZiweiPalace | undefined, name: string): boolean {
  const s = palace?.stars.find(x => x.name === name);
  return !!s && (s.brightness === '庙' || s.brightness === '旺');
}

function dim(palace: ZiweiPalace | undefined, name: string): boolean {
  const s = palace?.stars.find(x => x.name === name);
  return !!s && s.brightness === '陷';
}

function pat(name: string, type: ZiweiPattern['type'], description: string,
             palaces: string[], impact: number, evidence: string[]): ZiweiPattern {
  return {
    name, type, description, palaces, impact, evidence,
    explanationTrace: [{
      rule: 'ziwei.pattern.detect',
      detail: `${name} (${type}, impact=${impact}): ${description}`,
      data: { name, type, impact, evidence },
    }],
  };
}

export function detectPatterns(palaces: ZiweiPalace[], _sihua: SihuaInfo[]): {
  patterns: ZiweiPattern[];
  explanationTrace: ExplanationStep[];
} {
  const trace: ExplanationStep[] = [];
  const out: ZiweiPattern[] = [];
  const ming = palaces.find(p => p.isMing);
  if (!ming) return { patterns: out, explanationTrace: trace };

  const mingStars = starsIn(ming);
  const guanlu = palaces.find(p => p.name === '官禄');
  const caibo = palaces.find(p => p.name === '财帛');
  const sanFangPalaces = ming.sanFang.map(name => palaces.find(p => p.name === name)).filter(Boolean) as ZiweiPalace[];
  const sanFangStars = new Set<string>();
  for (const p of sanFangPalaces) for (const s of p.stars) sanFangStars.add(s.name);
  const allMingTriad = new Set<string>([...mingStars, ...sanFangStars]);

  // ── 吉格 ──
  if (mingStars.has('紫微') && mingStars.has('天府')) {
    out.push(pat('紫府同宫', '吉格', '帝星加库星同宫，主一生富贵双全', [ming.name], 9, ['紫微+天府@命宫']));
  }
  if (guanlu && caibo) {
    const gs = starsIn(guanlu); const cs = starsIn(caibo);
    if ((gs.has('紫微') || gs.has('天府')) && (cs.has('紫微') || cs.has('天府'))) {
      out.push(pat('紫府朝垣', '吉格', '紫微天府在三方四正拱照命宫，主大富大贵',
        [guanlu.name, caibo.name], 8, ['官禄/财帛包含紫微或天府']));
    }
  }
  const sunBright = palaces.some(p => bright(p, '太阳'));
  const moonBright = palaces.some(p => bright(p, '太阴'));
  if (sunBright && moonBright) {
    out.push(pat('日月并明', '吉格', '太阳太阴各在庙旺之位，聪明才智光明磊落', [], 7, ['太阳庙旺', '太阴庙旺']));
  }
  if (mingStars.has('左辅') || mingStars.has('右弼')) {
    out.push(pat('辅弼夹命', '吉格', '左辅右弼在命宫，贵人多助', [ming.name], 6, ['命宫含左辅或右弼']));
  }
  if (mingStars.has('天魁') || mingStars.has('天钺')) {
    out.push(pat('魁钺同宫', '吉格', '天魁天钺在命宫或三方，贵人提携', [ming.name], 6, ['命宫含天魁或天钺']));
  }
  if (ming.stars.some(s => s.sihua === '禄')) {
    out.push(pat('化禄入命', '吉格', '化禄飞入命宫，财源广进机遇频现', [ming.name], 7, ['命宫主星含化禄']));
  }
  if (mingStars.has('禄存') && mingStars.has('天马')) {
    out.push(pat('禄马交驰', '吉格', '禄存天马同宫，发财于远方动中生财', [ming.name], 7, ['禄存+天马@命宫']));
  }
  if (sanFangStars.has('天府') && sanFangStars.has('天相')) {
    out.push(pat('府相朝垣', '吉格', '天府天相在三方拱照，一生衣食无忧', ming.sanFang.map(String), 7, ['三方含天府+天相']));
  }
  if (mingStars.has('武曲') && mingStars.has('贪狼')) {
    out.push(pat('武贪同行', '特殊格', '武曲贪狼同宫，先武后文或先贫后富', [ming.name], 4, ['武曲+贪狼@命宫']));
  }
  const slPresent = [allMingTriad.has('七杀'), allMingTriad.has('破军'), allMingTriad.has('贪狼')].filter(Boolean).length;
  if (slPresent >= 2) {
    out.push(pat('杀破狼', '特殊格', '杀破狼会聚，一生变动大起大落，宜创业', [ming.name], 3, [`命+三方含 ${slPresent} 颗杀破狼`]));
  }
  if (allMingTriad.has('太阳') && allMingTriad.has('天梁') && allMingTriad.has('文昌') && allMingTriad.has('禄存')) {
    out.push(pat('阳梁昌禄', '吉格', '太阳天梁文昌禄存会聚，主科举成名', [ming.name], 8, ['命+三方含 阳梁昌禄']));
  }
  if (allMingTriad.has('文昌') && allMingTriad.has('文曲')) {
    out.push(pat('文星拱命', '吉格', '文昌文曲拱命，才华横溢文采斐然', [ming.name], 6, ['命+三方含 文昌+文曲']));
  }
  if (allMingTriad.has('天机') && allMingTriad.has('太阴') && allMingTriad.has('天同') && allMingTriad.has('天梁')) {
    out.push(pat('机月同梁', '特殊格', '天机太阴天同天梁会于三方，主从政文职', [], 5, ['命+三方含 机月同梁']));
  }

  // ── 凶格 ──
  if (palaces.some(p => dim(p, '太阳')) && palaces.some(p => dim(p, '太阴'))) {
    out.push(pat('日月反背', '凶格', '太阳太阴均落陷，主劳碌奔波', [], -6, ['太阳陷', '太阴陷']));
  }
  if (ming.stars.some(s => s.sihua === '忌')) {
    out.push(pat('化忌入命', '凶格', '化忌飞入命宫，阻碍波折需谨慎', [ming.name], -7, ['命宫主星含化忌']));
  }
  if (ming.stars.filter(s => s.type === 'sha').length >= 2) {
    out.push(pat('煞星聚命', '凶格', '多颗煞星汇聚命宫，一生多波折', [ming.name], -6, ['命宫煞星≥2']));
  }
  if (!ming.stars.some(s => s.type === 'major')) {
    out.push(pat('命无正曜', '特殊格', '命宫无主星，需借对宫星曜论吉凶', [ming.name], -2, ['命宫无主星']));
  }
  if (ming.stars.some(s => s.name === '擎羊' && s.brightness === '陷')) {
    out.push(pat('羊刃入命', '凶格', '擎羊陷落命宫，主刑克孤独', [ming.name], -5, ['擎羊陷@命宫']));
  }
  // 火铃夹命 (only adjacent neighbors of ming branch)
  const adj = [(ming.index + 1) % 12, ((ming.index - 1) % 12 + 12) % 12];
  const adjNames = adj.flatMap(i => palaces.find(p => p.index === i)?.stars.map(s => s.name) ?? []);
  if (adjNames.includes('火星') && adjNames.includes('铃星')) {
    out.push(pat('火铃夹命', '凶格', '火星铃星夹命宫，主一生多灾', [ming.name], -5, ['火星+铃星 夹命']));
  }

  if (out.length === 0) {
    out.push(pat('普通格局', '特殊格', '无明显大格局，以各宫星曜论吉凶', [], 0, []));
  }

  trace.push({
    rule: 'ziwei.pattern.summary',
    detail: `检测到 ${out.length} 个格局`,
    data: { count: out.length, patterns: out.map(p => p.name) },
  });
  return { patterns: out, explanationTrace: trace };
}
