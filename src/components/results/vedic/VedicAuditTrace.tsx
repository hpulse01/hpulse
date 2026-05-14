import type { EngineOutput } from '@/types/prediction';
import { EngineAuditTrace } from '../_shared/EnginePanelShell';
export function VedicAuditTrace({ engineOutput }: { engineOutput: EngineOutput }) {
  return <EngineAuditTrace engineOutput={engineOutput} />;
}
