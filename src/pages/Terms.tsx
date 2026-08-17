import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export default function Terms() {
  return (
    <LegalPage
      title="使用条款"
      description="H-Pulse 免费公测版使用条款。"
      path="/terms"
    >
      <LegalSection title="1. 服务性质">
        <p>H-Pulse 是多传统规则的文化研究、娱乐与自我反思工具。所有输出均依赖用户输入、算法版本、规则流派与已声明的不确定性，不是对未来事实的保证。</p>
      </LegalSection>

      <LegalSection title="2. 免费公测">
        <p>当前版本免费提供测试。功能、算法权重、可用性和数据结构可能在公测期间调整；任何重大变更都会记录算法版本并尽可能保留审计轨迹。</p>
      </LegalSection>

      <LegalSection title="3. 禁止用途">
        <p>不得将结果冒充科学结论或用于替代医疗、心理、法律、金融等专业意见；不得据此歧视、胁迫、欺诈、伤害他人，或对未成年人进行敏感预测。</p>
      </LegalSection>

      <LegalSection title="4. 账户与数据">
        <p>用户应保护登录凭据并保证提交信息具有合法处理权限。数据处理与删除方式见 <Link className="text-primary underline" to="/privacy">隐私政策</Link>；账户可在应用内或 <Link className="text-primary underline" to="/account-deletion">删除账户页面</Link>永久删除。</p>
      </LegalSection>

      <LegalSection title="5. 免责声明">
        <p>在法律允许的最大范围内，H-Pulse 不保证结果准确、完整或适合特定目的。遇到健康风险、心理危机或紧急情况，应立即联系当地专业机构或紧急服务。</p>
      </LegalSection>

      <LegalSection title="6. 联系方式">
        <p>条款问题请联系 <a className="text-primary underline" href="mailto:hpulse001@gmail.com">hpulse001@gmail.com</a>。</p>
      </LegalSection>
    </LegalPage>
  );
}
