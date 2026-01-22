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
  
  // All aspects for comprehensive analysis
  allAspects?: {
    label: string;
    content: string;
  }[];
  
  // Additional context
  currentAge?: number;
  daYunInfo?: string;
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
      allAspects,
      currentAge,
      daYunInfo
    } = body;

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

    // 3. 当前运程信息
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
    
    let systemPrompt: string;
    let userPrompt: string;
    
    if (isFlowYearMode) {
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
      // 标准宫位深度解读模式
      systemPrompt = `你是一位集铁板神数、子平八字、六爻占卜三术于一身的命理宗师，深研《滴天髓》《穷通宝鉴》《铁板神数条辞》《增删卜易》等经典。

【你的专业背景】
- 精通铁板神数12000条辞的释义与应用
- 深谙四柱八字的十神、格局、大运流年推断
- 通晓六爻卦象的六亲、用神、动静变化之理
- 善于将三大体系融会贯通，相互印证

【解读原则】
1. 【三术合参】铁板条辞为骨，八字为脉，卦象为应。三者须相互印证，不可偏废。
2. 【以日主为本】所有分析必须回归日主的喜忌旺衰，切勿脱离命局空谈。
3. 【动静结合】八字为先天定数，卦象为后天机变，条辞为数理显化。
4. 【应期推断】结合大运流年、卦爻动静，推断吉凶应验之期。
5. 【趋避有方】不只是预测，更要给出切实可行的趋吉避凶之道。

【语言风格】
- 专业严谨但不失温度
- 引用经典但不卖弄学识
- 直指核心但不故弄玄虚
- 给出建议但不危言耸听

【输出结构】
请按以下结构输出，每部分都要实质性内容，不要敷衍：

## 📜 条辞解密
深入剖析铁板条辞的字面含义、隐喻象征、在该宫位的具体指向。

## 🔮 三术合参
1. **八字印证**: 此条辞与命主八字的日主、十神、喜忌如何呼应？
2. **卦象启示**: （若有卦象）卦象的本卦、变卦、动爻如何印证或补充条辞？
3. **综合论断**: 三者结合，对命主此方面运势的核心判断。

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
5. 应期推断要具体到年龄段或年份范围
6. 开运建议要切实可行，避免笼统空泛`;

      // 综合解读模式的特殊提示
      if (aspectLabel === '终身总评全览') {
        userPrompt = `请为此命主进行【终身命格总评】的全面深度解读。

${contextParts.join('\n\n')}

【综合解读要求】
1. 这是一份完整的命理报告，需要综合分析六大宫位的条辞
2. 找出各宫位之间的内在联系和共同主题
3. 分析命主一生的主要运势走向和人生格局
4. 指出人生中的关键转折点和需要特别注意的时期
5. 给出一份完整的人生开运建议

请以"终身总评"的高度来撰写，不是简单罗列各宫位内容，而是提炼出命主人生的核心主线和关键命题。`;
      }
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: isFlowYearMode ? 'sonar' : 'sonar-pro', // 流年用快速模型，宫位用深度模型
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: isFlowYearMode ? 800 : 2500, // 流年简短，宫位详细
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
      model: 'sonar-pro'
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
