/**
 * AI Interpretation Edge Function (高级版)
 * 
 * 融合三大命理体系进行深度解读：
 * 1. 八字命理 (Four Pillars) - 十神、藏干、纳音、五行平衡
 * 2. 铁板神数 (Iron Plate) - 太玄数理、宫位条文
 * 3. 六爻卦象 (Liu Yao) - 六亲、动爻、卦变
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InterpretRequest {
  // Core clause data
  clauseContent: string;
  aspectLabel: string;
  
  // BaZi context (enhanced)
  pillarsDisplay: string;
  baziProfile?: {
    dayMaster: string;
    dayMasterElement: string;
    strength: string;
    favorableElements: string[];
    unfavorableElements: string[];
    pillars: {
      year: string;
      month: string;
      day: string;
      time: string;
    };
    // Enhanced fields
    tenGods?: { position: string; stem: string; tenGod: string }[];
    hiddenStems?: { position: string; branch: string; hiddenStems: { stem: string; tenGod: string }[] }[];
    naYin?: { pillar: string; naYin: string }[];
    pattern?: { name: string; type: string };
  };
  
  // Liu Yao hexagram context (enhanced)
  hexagram?: {
    name: string;
    symbol: string;
    lines: number[];
    changingLines: number[];
    interpretation: string;
    targetHexagramName?: string;
    dominantElement?: string;
    movingRelatives?: string[];
  };
  
  // Ziwei Doushu context
  ziweiProfile?: {
    mingGong: string;
    shenGong: string;
    mingElement: string;
    shenElement: string;
    palaces: { name: string; branch: string }[];
  };
  
  // All aspects for comprehensive analysis
  allAspects?: {
    label: string;
    content: string;
  }[];
  
  // Additional context
  currentAge?: number;
  daYunInfo?: string;
  
  // Continuation support
  previousContent?: string;
  continueGeneration?: boolean;
  
  // Analysis mode flags
  isZiweiAnalysis?: boolean;
  isComprehensiveMode?: boolean;
}

// 铁板神数宫位体系
const PALACE_MEANINGS: Record<string, string> = {
  '命运总论': '先天命格、一生运势主轴、性格禀赋、人生格局高低',
  '婚姻姻缘': '配偶特质、婚姻早晚、夫妻感情、婚姻吉凶',
  '财运财富': '财富格局、求财方式、财运起伏、守财能力',
  '事业前程': '事业类型、仕途前程、职业发展、事业成就',
  '健康寿元': '身体状况、疾病倾向、寿元长短、健康注意',
  '子嗣后代': '子女多寡、子女贤孝、生育时机、子女运势',
};

// 十神含义深度解析
const TEN_GOD_DEEP_MEANINGS: Record<string, string> = {
  '比肩': '自我意识强、独立自主、竞争心态，主兄弟朋友、平辈关系',
  '劫财': '争夺心重、敢于冒险、不服输，主破财争端、感情波折',
  '食神': '才华横溢、性格温和、福气深厚，主才艺表达、子女运',
  '伤官': '聪明叛逆、追求完美、傲气外露，主创新突破、口舌是非',
  '偏财': '横财运好、人缘广泛、慷慨大方，主外财、父亲、偏房',
  '正财': '勤劳致富、理财有道、重视稳定，主正业收入、妻星',
  '七杀': '权威压力、竞争对手、意外灾厄，主官非、小人、魄力',
  '正官': '规矩守法、名誉地位、贵人扶持，主事业、丈夫、权力',
  '偏印': '思想独特、学艺多师、偏门知识，主后母、偏业、玄学',
  '正印': '学识渊博、慈爱保护、贵人相助，主母亲、文凭、名声',
};

// 六亲动爻含义
const MOVING_RELATIVE_MEANINGS: Record<string, string> = {
  '父母': '父母爻动主文书、证件、房屋有变动，或长辈事宜需注意',
  '兄弟': '兄弟爻动主竞争加剧、人际变化，需防破财争端',
  '子孙': '子孙爻动主福气临门、子女有事，或享乐消费增加',
  '妻财': '妻财爻动主财运波动、感情变化，有进财或破财之象',
  '官鬼': '官鬼爻动主事业变动、官非疾病，需谨慎应对压力',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('pplx');
    if (!apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const body: InterpretRequest = await req.json();
    const { 
      clauseContent, 
      aspectLabel, 
      pillarsDisplay, 
      baziProfile,
      hexagram,
      ziweiProfile,
      allAspects,
      currentAge,
      daYunInfo,
      previousContent,
      continueGeneration,
      isZiweiAnalysis,
      isComprehensiveMode
    } = body;
    
    // Calculate dynamic weights based on available data
    const availableSystems: string[] = [];
    if (baziProfile) availableSystems.push('八字');
    if (hexagram) availableSystems.push('六爻');
    if (ziweiProfile) availableSystems.push('紫微');
    if (allAspects && allAspects.length > 0) availableSystems.push('铁板');
    
    const systemCount = availableSystems.length;
    const isMultiSystem = systemCount >= 2;

    // =====================
    // 构建深度命理上下文
    // =====================
    
    let contextParts: string[] = [];
    
    // 1. 八字命盘深度分析
    if (baziProfile) {
      let baziContext = `【八字命盘·深度剖析】
┌─────────────────────────────────────────┐
│ 四柱排盘: ${pillarsDisplay}
│ 年柱: ${baziProfile.pillars.year} ｜ 月柱: ${baziProfile.pillars.month}
│ 日柱: ${baziProfile.pillars.day} ｜ 时柱: ${baziProfile.pillars.time}
├─────────────────────────────────────────┤
│ 日主: ${baziProfile.dayMaster}（${baziProfile.dayMasterElement}）
│ 身强弱: ${baziProfile.strength}
│ 喜用神: ${baziProfile.favorableElements.join('、')}
│ 忌 神: ${baziProfile.unfavorableElements.join('、')}`;

      // 十神配置
      if (baziProfile.tenGods && baziProfile.tenGods.length > 0) {
        baziContext += `
├─────────────────────────────────────────┤
│ 十神配置:`;
        baziProfile.tenGods.forEach(tg => {
          const meaning = TEN_GOD_DEEP_MEANINGS[tg.tenGod] || '';
          baziContext += `
│   ${tg.position}: ${tg.stem} → ${tg.tenGod}`;
        });
      }

      // 纳音
      if (baziProfile.naYin && baziProfile.naYin.length > 0) {
        baziContext += `
├─────────────────────────────────────────┤
│ 纳音五行:`;
        baziProfile.naYin.forEach(ny => {
          baziContext += `
│   ${ny.pillar}: ${ny.naYin}`;
        });
      }

      // 格局
      if (baziProfile.pattern) {
        baziContext += `
├─────────────────────────────────────────┤
│ 命格: ${baziProfile.pattern.name} (${baziProfile.pattern.type})`;
      }

      baziContext += `
└─────────────────────────────────────────┘`;
      contextParts.push(baziContext);
      
      // 添加十神解析说明
      if (baziProfile.tenGods && baziProfile.tenGods.length > 0) {
        const uniqueGods = [...new Set(baziProfile.tenGods.map(tg => tg.tenGod))];
        const godExplanations = uniqueGods
          .filter(g => TEN_GOD_DEEP_MEANINGS[g])
          .map(g => `${g}: ${TEN_GOD_DEEP_MEANINGS[g]}`)
          .join('\n');
        if (godExplanations) {
          contextParts.push(`【十神含义参考】\n${godExplanations}`);
        }
      }
    } else {
      contextParts.push(`【八字】${pillarsDisplay}`);
    }

    // 2. 六爻卦象深度分析
    if (hexagram) {
      let hexContext = `【六爻时间卦·深度剖析】
┌─────────────────────────────────────────┐
│ 本 卦: ${hexagram.name} ${hexagram.symbol}
│ 卦 义: ${hexagram.interpretation}`;

      if (hexagram.targetHexagramName) {
        hexContext += `
├─────────────────────────────────────────┤
│ 变 卦: ${hexagram.targetHexagramName}
│ 卦变说明: 本卦为当前状态，变卦为发展趋势`;
      }

      if (hexagram.changingLines && hexagram.changingLines.length > 0) {
        hexContext += `
├─────────────────────────────────────────┤
│ 动爻位置: ${hexagram.changingLines.map(l => `第${l}爻`).join('、')}
│ 动爻数量: ${hexagram.changingLines.length}爻动`;
        
        // 动爻六亲解析
        if (hexagram.movingRelatives && hexagram.movingRelatives.length > 0) {
          hexContext += `
│ 动爻六亲: ${hexagram.movingRelatives.join('、')}发动`;
          hexagram.movingRelatives.forEach(rel => {
            if (MOVING_RELATIVE_MEANINGS[rel]) {
              hexContext += `
│   → ${MOVING_RELATIVE_MEANINGS[rel]}`;
            }
          });
        }
      } else {
        hexContext += `
├─────────────────────────────────────────┤
│ 六爻皆静，事态稳定，按现有轨迹发展`;
      }

      if (hexagram.dominantElement) {
        hexContext += `
├─────────────────────────────────────────┤
│ 卦中旺气: ${hexagram.dominantElement}`;
      }

      hexContext += `
└─────────────────────────────────────────┘`;
      contextParts.push(hexContext);
    }

    // 3. 紫微斗数命盘分析
    if (ziweiProfile) {
      let ziweiContext = `【紫微斗数·命盘格局】
┌─────────────────────────────────────────┐
│ 命宫: ${ziweiProfile.mingGong}宫 (${ziweiProfile.mingElement || ''}气)
│ 身宫: ${ziweiProfile.shenGong}宫 (${ziweiProfile.shenElement || ''}气)
├─────────────────────────────────────────┤
│ 命身关系: ${ziweiProfile.mingGong === ziweiProfile.shenGong ? '命身同宫，先后天合一' : '命身分离，先后天各有侧重'}`;

      if (ziweiProfile.palaces && ziweiProfile.palaces.length > 0) {
        const keyPalaces = ziweiProfile.palaces.filter(p => 
          ['官禄', '财帛', '夫妻', '子女'].includes(p.name)
        );
        if (keyPalaces.length > 0) {
          ziweiContext += `
├─────────────────────────────────────────┤
│ 关键宫位:`;
          keyPalaces.forEach(p => {
            ziweiContext += `
│   ${p.name}宫在${p.branch}`;
          });
        }
      }

      ziweiContext += `
└─────────────────────────────────────────┘`;
      contextParts.push(ziweiContext);
    }

    // 4. 当前运程信息
    if (currentAge || daYunInfo) {
      let periodContext = `【当前运程】`;
      if (currentAge) {
        periodContext += `\n当前年龄: ${currentAge}岁`;
      }
      if (daYunInfo) {
        periodContext += `\n大运信息: ${daYunInfo}`;
      }
      contextParts.push(periodContext);
    }

    // 4. 铁板神数宫位条文
    const palaceMeaning = PALACE_MEANINGS[aspectLabel] || '命理运势';
    contextParts.push(`【铁板神数·${aspectLabel}宫】
宫位主司: ${palaceMeaning}
┌─────────────────────────────────────────┐
│ 原文条辞:
│ ${clauseContent}
└─────────────────────────────────────────┘`);

    // 5. 其他宫位参考（简要）
    if (allAspects && allAspects.length > 0) {
      const otherAspects = allAspects.filter(a => a.label !== aspectLabel);
      if (otherAspects.length > 0 && aspectLabel === '终身总评全览') {
        // 综合解读模式 - 列出所有宫位
        contextParts.push(`【六大宫位总览】
${allAspects.map(a => `【${a.label}】${a.content}`).join('\n\n')}`);
      } else if (otherAspects.length > 0) {
        // 单宫解读模式 - 简要参考其他宫位
        contextParts.push(`【其他宫位参考】
${otherAspects.slice(0, 3).map(a => `${a.label}: ${a.content.substring(0, 50)}...`).join('\n')}`);
      }
    }

    // =====================
    // 构建专业提示词
    // =====================
    
    // 检测是否为流年解读模式
    const isFlowYearMode = aspectLabel.includes('流年');
    
    // 检测是否为紫微斗数解读模式
    const isZiweiMode = isZiweiAnalysis === true;
    
    let systemPrompt: string;
    let userPrompt: string;
    
    if (isZiweiMode) {
      // 紫微斗数命盘解读模式
      systemPrompt = `你是一位精通紫微斗数的命理师，对十二宫位、十四主星、四化飞星有深入研究。

【专业背景】
- 深研紫微斗数传统理论，精通命盘格局分析
- 擅长从宫位五行、生克关系推断命主性格与运势
- 善于将紫微斗数与四柱八字相互印证

【解读原则】
1. 命宫为一生之根本，身宫为后天行运之所在
2. 宫位五行生克影响格局高低
3. 结合八字日主喜忌进行综合分析
4. 给出实用的趋避建议

【输出格式】（按此结构，每部分2-4句话）

## 🌟 命盘格局
分析命宫、身宫落宫的五行属性及其含义

## 📊 性格特质
根据命宫宫位推断命主的基本性格和处事风格

## 💼 事业财运
分析官禄宫、财帛宫对事业财运的影响

## 💝 感情婚姻
分析夫妻宫、子女宫对感情家庭的指示

## 🔮 运势提示
结合身宫分析后天运势走向

## 💡 开运建议
根据宫位五行给出具体的趋吉避凶建议`;

      userPrompt = `${clauseContent}

请根据以上紫微命盘信息，分析命主的命格特点和人生运势。`;
    } else if (isFlowYearMode) {
      // 流年简化解读模式
      systemPrompt = `你是一位精通铁板神数的命理师，擅长解读流年条辞。

【解读原则】
- 简明扼要，直指核心
- 结合八字日主喜忌分析
- 给出实用的趋避建议

【输出格式】（严格按此格式，每部分2-3句话即可）

## 📅 流年主题
一句话概括此年运势主题

## 🔍 运势解析
**吉象**: xxx
**忌象**: xxx
**应期**: 具体到月份或季节

## 💡 趋避建议
- 宜: xxx
- 忌: xxx
- 注意: xxx`;

      userPrompt = `请解读此流年条辞：

【${aspectLabel}】
条辞: ${clauseContent}
八字: ${pillarsDisplay}
日主: ${baziProfile?.dayMaster || ''}（${baziProfile?.dayMasterElement || ''}）
喜用: ${baziProfile?.favorableElements?.join('、') || '待定'}

请简洁解读此年运势，重点分析吉凶和具体月份应期。`;
    } else {
      // 标准宫位深度解读模式 - 四术合参
      const systemsInUse = availableSystems.join('、') || '命理';
      
      systemPrompt = `你是一位集铁板神数、子平八字、六爻占卜、紫微斗数四术于一身的命理宗师，深研《滴天髓》《穷通宝鉴》《铁板神数条辞》《增删卜易》《紫微斗数全书》等经典。

【你的专业背景】
- 精通铁板神数12000条辞的释义与应用
- 深谙四柱八字的十神、格局、大运流年推断
- 通晓六爻卦象的六亲、用神、动静变化之理
- 精研紫微斗数的星曜格局、命身宫位分析
- 善于将多体系融会贯通，求同存异，相互印证

【当前可用体系】${systemsInUse}

【解读原则】
1. 【多术合参】以铁板条辞为骨，八字为脉，卦象为机，紫微为辅。多体系须相互印证，求同存异。
2. 【以日主为本】所有分析必须回归日主的喜忌旺衰，切勿脱离命局空谈。
3. 【动静结合】八字为先天定数，卦象为后天机变，条辞为数理显化，紫微为格局参照。
4. 【应期推断】结合大运流年、卦爻动静，推断吉凶应验之期。
5. 【趋避有方】不只是预测，更要给出切实可行的趋吉避凶之道。
6. 【共识优先】多体系共同指向的结论可信度最高，应重点阐述。

【语言风格】
- 专业严谨但不失温度
- 引用经典但不卖弄学识
- 直指核心但不故弄玄虚
- 给出建议但不危言耸听

【输出结构】
请按以下结构输出，每部分都要实质性内容，不要敷衍：

## 📜 条辞解密
深入剖析铁板条辞的字面含义、隐喻象征、在该宫位的具体指向。

## 🔮 多术合参
1. **八字印证**: 此条辞与命主八字的日主、十神、喜忌如何呼应？
2. **卦象启示**: （若有卦象）卦象的本卦、变卦、动爻如何印证或补充条辞？
3. **紫微参照**: （若有紫微）命身宫位与此领域的关联分析
4. **综合论断**: 多术结合，对命主此方面运势的核心判断（标注共识度）

## ⏰ 应期推测
根据大运流年、卦爻动静，推测此条辞可能应验的时间段或人生阶段。

## 💎 开运指南
针对命主的八字喜忌和卦象提示，给出：
- 方位五行调理
- 行业职业建议
- 人际关系经营
- 时机把握要点
- 需特别注意的事项`;

      userPrompt = `请为此命主进行【${aspectLabel}】的深度解读。

${contextParts.join('\n\n')}

【解读要求】
1. 必须紧密结合命主的日主${baziProfile?.dayMaster || ''}（${baziProfile?.dayMasterElement || ''}）和身强弱（${baziProfile?.strength || ''}）来分析
2. 喜用神为${baziProfile?.favorableElements?.join('、') || '待定'}，分析时注意五行生克关系
3. 条辞中的关键词要逐一解读，不可遗漏
4. ${hexagram ? `结合${hexagram.name}卦象和${hexagram.changingLines?.length || 0}个动爻进行印证` : '此次无卦象参考，以八字和条辞为主'}
5. ${ziweiProfile ? `参考紫微命盘：命宫在${ziweiProfile.mingGong}、身宫在${ziweiProfile.shenGong}` : ''}
6. 应期推断要具体到年龄段或年份范围
7. 开运建议要切实可行，避免笼统空泛
8. 【重要】若多体系对同一结论有共识，请标注"（多术共识）"以示可信度高`;

      // 综合解读模式的特殊提示 - 动态权重多术合参
      if (aspectLabel === '终身总评全览') {
        // Build dynamic system weight description
        const systemWeights: string[] = [];
        if (baziProfile) systemWeights.push('八字命理（先天格局、十神配置、喜忌分析）权重35%');
        if (allAspects && allAspects.length > 0) systemWeights.push('铁板神数（太玄数理、宫位条辞）权重30%');
        if (hexagram) systemWeights.push('六爻卦象（时运机变、动爻启示）权重20%');
        if (ziweiProfile) systemWeights.push('紫微斗数（命身宫位、星曜格局）权重15%');
        
        const dynamicWeightDesc = systemWeights.length > 0 
          ? `\n【动态权重分配】（基于可用数据自动调整）\n${systemWeights.join('\n')}`
          : '';

        userPrompt = `请为此命主进行【终身命格总评】的全面深度解读。

${contextParts.join('\n\n')}
${dynamicWeightDesc}

【四术合参·求同存异分析法】

**核心原则**: 多体系交叉验证，找出共识性结论，标注分歧点

1. **求同分析（高权重）**: 
   - 找出各体系对同一命题的共同指向（如：八字官星旺+铁板事业宫吉+紫微官禄宫佳 → 事业高度共识）
   - 多体系共识的结论可信度最高，应作为核心论断

2. **存异分析（需说明）**:
   - 若体系间存在分歧（如：八字财星弱但铁板财运宫旺），需分析原因
   - 可能是先天vs后天、早年vs晚年、主动vs被动等维度差异
   - 标注分歧但不强行统一，给出分层解读

3. **五行贯穿法**:
   - 以命主的喜用五行为主线，串联各体系分析
   - 八字喜用 → 铁板条辞五行暗示 → 卦象旺气 → 紫微宫位五行
   - 五行一致则强化，五行相克则需调和

4. **时空定位法**:
   - 八字定格局高低（空间维度）
   - 大运流年定时机（时间维度）
   - 卦象定当下机变（即时维度）
   - 紫微定后天发展（发展维度）

【输出结构】

## 🎯 命格核心（多术共识）
提炼各体系对命主根本格局的共同认知，这是可信度最高的结论

## 📊 六宫综述（分项分析）
对六大人生领域逐一分析，每项标注各体系观点的一致性或分歧

## 🔄 运势周期（时空定位）
结合大运流年和卦象，划分人生主要阶段和关键转折点

## ⚖️ 存异说明（分歧解读）
如有体系间分歧，此处专门解释原因和分层理解

## 💎 综合开运（全局建议）
基于多术共识，给出五行调理、方位选择、行业建议、关键年份提示

请以"命理大宗师"的高度进行多体系融合分析，追求最高可信度的综合结论。`;
      }
    }

    // Handle continuation mode
    if (continueGeneration && previousContent) {
      const continueSystemPrompt = `你是一位集铁板神数、子平八字、六爻占卜三术于一身的命理宗师。
用户之前的解读被中断了，请根据之前的内容继续生成，保持风格一致。
不要重复之前已经写过的内容，直接从中断处继续。
如果之前的内容已经接近完成，请补充结论或总结。`;

      const continueUserPrompt = `之前的解读内容（已生成部分）：
${previousContent}

请继续生成剩余的内容。如果开运指南或总结部分还没写完，请补充完整。`;

      const continueResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: continueSystemPrompt },
            { role: 'user', content: continueUserPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.5,
        }),
      });

      if (!continueResponse.ok) {
        const error = await continueResponse.text();
        console.error('Perplexity API error:', error);
        throw new Error(`Perplexity API error: ${continueResponse.status}`);
      }

      const continueData = await continueResponse.json();
      const continuation = continueData.choices?.[0]?.message?.content || '';

      return new Response(JSON.stringify({ 
        interpretation: continuation,
        citations: continueData.citations || [],
        model: 'sonar'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Select model based on analysis type
    const useQuickModel = isFlowYearMode || isZiweiMode;
    const maxTokensForRequest = isFlowYearMode ? 800 : (isZiweiMode ? 1200 : 3000);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: useQuickModel ? 'sonar' : 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokensForRequest,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Perplexity API error:', error);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const interpretation = data.choices?.[0]?.message?.content || '解读失败，请重试。';

    return new Response(JSON.stringify({ 
      interpretation,
      citations: data.citations || [],
      model: useQuickModel ? 'sonar' : 'sonar-pro'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('AI Interpret error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ 
      error: message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
