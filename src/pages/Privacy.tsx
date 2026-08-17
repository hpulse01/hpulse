import { Link } from 'react-router-dom';
import { LegalPage, LegalSection } from '@/components/legal/LegalPage';

export default function Privacy() {
  return (
    <LegalPage
      title="隐私政策"
      description="H-Pulse 隐私政策与数据生命周期说明。"
      path="/privacy"
    >
      <LegalSection title="1. 我们处理的数据">
        <p>账户数据：邮箱、显示名称、认证标识及账户等级。</p>
        <p>计算数据：出生日期与时间、出生地点、坐标、时区、性别、查询时间、校时事实及由此生成的结果和验证记录。</p>
        <p>安全数据：注册时的 IP 会先在服务端做单向键控哈希；短期防滥用记录保留不超过 24 小时，账户资料中的哈希值保留至账户删除。我们不在客户端保存 Supabase 服务角色密钥。</p>
      </LegalSection>

      <LegalSection title="2. 使用目的">
        <p>上述数据仅用于账户认证、运行与保存用户主动发起的计算、跨设备同步、算法审计、用户反馈验证、安全防滥用及故障排查。</p>
        <p>H-Pulse 免费公测版不包含广告，不出售个人数据，也不将出生资料用于广告画像。</p>
      </LegalSection>

      <LegalSection title="3. 存储、共享与保留">
        <p>账户与应用数据由 Supabase 提供的认证、数据库及边缘函数服务处理。仅在提供服务、履行安全义务或法律要求所必需的范围内向服务提供商传输。</p>
        <p>账户资料及用户保存的预测记录默认保留至用户主动删除；用户可单独删除预测与事件记录，也可删除整个账户。</p>
      </LegalSection>

      <LegalSection title="4. 用户控制">
        <p>用户可以在账户菜单中选择“永久删除账户”，删除认证账户、个人资料、预测记录和真实事件回填。也可访问 <Link className="text-primary underline" to="/account-deletion">删除账户页面</Link>。</p>
        <p>如无法登录，可发送邮件至 <a className="text-primary underline" href="mailto:hpulse001@gmail.com">hpulse001@gmail.com</a> 发起请求；我们会先验证账户所有权。</p>
      </LegalSection>

      <LegalSection title="5. 敏感结论与未成年人">
        <p>输入与输出可能涉及健康、家庭与人生事件。结果仅用于文化研究、娱乐与自我反思，不构成医疗、心理、法律、金融或其他专业建议。本服务不面向未满 18 周岁的用户。</p>
      </LegalSection>

      <LegalSection title="6. 联系与更新">
        <p>隐私问题请联系 <a className="text-primary underline" href="mailto:hpulse001@gmail.com">hpulse001@gmail.com</a>。政策发生实质变化时，应用会要求用户重新确认。</p>
      </LegalSection>
    </LegalPage>
  );
}
