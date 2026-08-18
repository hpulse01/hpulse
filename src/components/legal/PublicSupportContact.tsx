import { PUBLIC_SUPPORT_EMAIL, publicSupportMailto } from '@/config/publicContact';

interface Props {
  subject?: string;
  className?: string;
}

export function PublicSupportContact({ subject, className }: Props) {
  const href = publicSupportMailto(subject);
  if (!href) {
    return (
      <span className={className} data-support-contact="unconfigured">
        公开支持通道尚未配置（商用发布阻塞项）
      </span>
    );
  }
  return (
    <a className={className} href={href} data-support-contact="configured">
      {PUBLIC_SUPPORT_EMAIL}
    </a>
  );
}
