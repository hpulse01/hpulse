import type { EngineOutput } from '@/types/prediction';
import { EngineAuditTrace } from '../_shared/EnginePanelShell';
interface Props { engineOutput: EngineOutput }
export function LiuRenAuditTrace({ engineOutput }: Props) {
  return <EngineAuditTrace engineOutput={engineOutput} />;
}
