import type { EngineOutput } from '@/types/prediction';
import { EngineAuditTrace } from '../_shared/EnginePanelShell';
export function WesternAuditTrace({ engineOutput }: { engineOutput: EngineOutput }) {
  return <EngineAuditTrace engineOutput={engineOutput} />;
}
