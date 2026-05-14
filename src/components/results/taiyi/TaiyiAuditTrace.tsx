import type { EngineOutput } from '@/types/prediction';
import { EngineAuditTrace } from '../_shared/EnginePanelShell';
export function TaiyiAuditTrace({ engineOutput }: { engineOutput: EngineOutput }) {
  return <EngineAuditTrace engineOutput={engineOutput} />;
}
