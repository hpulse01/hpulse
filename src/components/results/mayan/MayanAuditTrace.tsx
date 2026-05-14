import type { EngineOutput } from '@/types/prediction';
import { EngineAuditTrace } from '../_shared/EnginePanelShell';
export function MayanAuditTrace({ engineOutput }: { engineOutput: EngineOutput }) {
  return <EngineAuditTrace engineOutput={engineOutput} />;
}
