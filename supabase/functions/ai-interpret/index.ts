/**
 * AI Interpretation Edge Function
 * Uses Perplexity API to provide deep interpretation of destiny clauses
 * Combines BaZi, Iron Plate, and optionally Liu Yao hexagram
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
  
  // BaZi context
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
  };
  
  // Optional Liu Yao hexagram context
  hexagram?: {
    name: string;
    symbol: string;
    lines: number[];
    changingLines: number[];
    interpretation: string;
  };
  
  // All aspects for comprehensive analysis
  allAspects?: {
    label: string;
    content: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight
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
      allAspects
    } = body;

    // Build comprehensive context
    let contextParts: string[] = [];
    
    // BaZi context
    if (baziProfile) {
      contextParts.push(`【八字命盘】
四柱: ${pillarsDisplay}
年柱: ${baziProfile.pillars.year} | 月柱: ${baziProfile.pillars.month} | 日柱: ${baziProfile.pillars.day} | 时柱: ${baziProfile.pillars.time}
日主: ${baziProfile.dayMaster}（${baziProfile.dayMasterElement}）
身强弱: ${baziProfile.strength}
喜用神: ${baziProfile.favorableElements.join('、')}
忌神: ${baziProfile.unfavorableElements.join('、')}`);
    } else {
      contextParts.push(`【八字】${pillarsDisplay}`);
    }

    // Hexagram context if available
    if (hexagram) {
      contextParts.push(`【六爻卦象】
卦名: ${hexagram.name}
卦象: ${hexagram.symbol}
动爻: ${hexagram.changingLines.length > 0 ? hexagram.changingLines.map(l => `第${l}爻`).join('、') : '无动爻'}
卦辞: ${hexagram.interpretation}`);
    }

    // Other aspects context
    if (allAspects && allAspects.length > 0) {
      const otherAspects = allAspects.filter(a => a.label !== aspectLabel);
      if (otherAspects.length > 0) {
        contextParts.push(`【其他宫位参考】
${otherAspects.map(a => `${a.label}: ${a.content}`).join('\n')}`);
      }
    }

    // Current aspect
    contextParts.push(`【${aspectLabel}条文】
${clauseContent}`);

    const systemPrompt = `你是一位精通中国传统命理学的资深大师，专精于铁板神数、八字命理和六爻预测。你需要以专业、严谨、深入的方式解读命理条文。

解读要求：
1. 必须结合八字命盘的日主、五行喜忌来分析条文含义
2. 如果有六爻卦象，要将卦象与条文、八字三者结合解读
3. 指出此条文对命主人生的具体影响和应期（大致时间段）
4. 给出趋吉避凶的实际建议
5. 语言要专业但通俗易懂，避免过于晦涩
6. 不要有算命的迷信成分，以传统文化学术视角解读

输出格式：
📜 条文释义（详细解释古文含义）
🔮 命理分析（结合八字、卦象分析）
📅 应期推断（可能应验的时间或阶段）
💡 开运建议（实际可行的建议）`;

    const userPrompt = `请深入解读以下命理信息：

${contextParts.join('\n\n')}

请从${aspectLabel}这一宫位的角度，结合以上所有信息进行专业解读。`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
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
      citations: data.citations || []
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
