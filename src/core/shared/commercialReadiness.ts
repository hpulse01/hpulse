/**
 * Fail-closed commercial release gate.
 *
 * This module audits implementation completeness, traceability and unsafe
 * output. It does not and cannot certify cultural divination as scientifically
 * predictive. A release is blocked until every declared product engine passes
 * the same explicit evidence contract.
 */
import type {
  CommercialReadinessBlocker,
  CommercialReadinessReport,
  EngineName,
  EngineOutput,
} from '@/types/prediction';
import { ALL_ENGINE_NAMES } from '@/types/prediction';
import { ALGORITHM_SOURCE_REGISTRY, getEngineSource } from './algorithmSourceRegistry';
import { checkExplanation } from './explanation';
import { getImplementationStatus, validateEngineOutput } from './validation';

export interface CommercialReadinessOptions {
  requiredEngines?: readonly EngineName[];
  minimumCompletenessScore?: number;
  failedEngines?: ReadonlyArray<{ engineName: string; error: string }>;
}

const ACCEPTABLE_SOURCE_GRADES = new Set(['A', 'B']);
const STABLE_SOURCE_REFERENCE = /^(?:https?:\/\/|doi:|isbn:|urn:)/i;

/**
 * Phrases that make an individualized mortality/lifespan claim. Generic
 * cultural symbolism such as a translated card/day-sign name is not enough;
 * the gate targets claims, ages and prediction windows.
 */
const UNSAFE_MORTALITY_PATTERNS: RegExp[] = [
  /寿(?:命|元)(?:预测|推断|为|约|是|止|尽|终|到|至|\s*[:：]?\s*\d)/i,
  /(?:死亡|去世)(?:年龄|时间|日期|窗口|预测|推断|概率|风险\s*[:：]?\s*\d)/i,
  /(?:死期|终寿之数|寿终之数|寿数\s*[:：]?\s*\d)/i,
  /(?:predicted|expected|estimated)\s+(?:death|lifespan|mortality)/i,
  /(?:death|mortality)\s+(?:age|date|time|window|probability|prediction|estimate)/i,
  /lifespan\s*(?:prediction|estimate|age|window|[:=]\s*\d)/i,
];

function stripExplicitBoundaryNotices(value: string): string {
  return value
    .replace(/(?:不是|并非|不表示|不构成|不得解释为)(?:任何)?(?:寿命(?:预测|推断|估计)?|死亡(?:年龄|时间|日期|预测|推断)?)/gi, '')
    .replace(/(?:is\s+not|does\s+not\s+represent|must\s+not\s+be\s+interpreted\s+as)\s+(?:a\s+)?(?:lifespan|death|mortality)(?:\s+(?:prediction|estimate|age|date|time|window))?/gi, '');
}

function hasStableSourceReference(refs: readonly string[]): boolean {
  return refs.some((ref) => STABLE_SOURCE_REFERENCE.test(ref.trim()));
}

function collectUnsafeStringValues(
  value: unknown,
  path: string,
  findings: Array<{ path: string; value: string }>,
  seen: Set<object>,
): void {
  if (typeof value === 'string') {
    const claimSurface = stripExplicitBoundaryNotices(value);
    if (UNSAFE_MORTALITY_PATTERNS.some((pattern) => pattern.test(claimSurface))) {
      findings.push({ path, value });
    }
    return;
  }
  if (value == null || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafeStringValues(item, `${path}[${index}]`, findings, seen));
    return;
  }

  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    collectUnsafeStringValues(item, path ? `${path}.${key}` : key, findings, seen);
  }
}

function addBlocker(
  blockers: CommercialReadinessBlocker[],
  blocker: CommercialReadinessBlocker,
): void {
  const duplicate = blockers.some((current) =>
    current.code === blocker.code
    && current.engineName === blocker.engineName
    && current.path === blocker.path
    && current.detail === blocker.detail,
  );
  if (!duplicate) blockers.push(blocker);
}

export function assessCommercialReadiness(
  outputs: readonly EngineOutput[],
  options: CommercialReadinessOptions = {},
): CommercialReadinessReport {
  const requiredEngines = [...(options.requiredEngines ?? ALL_ENGINE_NAMES)];
  const minimumCompletenessScore = options.minimumCompletenessScore ?? 90;
  const blockers: CommercialReadinessBlocker[] = [];
  const byEngine = new Map<string, EngineOutput[]>();

  for (const output of outputs) {
    const existing = byEngine.get(output.engineName) ?? [];
    existing.push(output);
    byEngine.set(output.engineName, existing);
  }

  for (const failed of options.failedEngines ?? []) {
    addBlocker(blockers, {
      code: 'engine_execution_failed',
      engineName: failed.engineName,
      detail: `Engine execution failed: ${failed.error}`,
    });
  }

  for (const engineName of requiredEngines) {
    const matches = byEngine.get(engineName) ?? [];
    if (matches.length === 0) {
      addBlocker(blockers, {
        code: 'required_engine_missing',
        engineName,
        detail: 'Required product engine produced no output.',
      });
      continue;
    }
    if (matches.length > 1) {
      addBlocker(blockers, {
        code: 'duplicate_engine_output',
        engineName,
        detail: `Expected one output, received ${matches.length}.`,
      });
    }
  }

  for (const output of outputs) {
    const engineName = output.engineName;
    const registry = getEngineSource(engineName);
    if (!registry) {
      addBlocker(blockers, {
        code: 'unregistered_engine',
        engineName,
        detail: 'Engine has no audited source-registry record.',
      });
    } else {
      if (registry.implementationStatus !== 'complete') {
        addBlocker(blockers, {
          code: 'registry_status_incomplete',
          engineName,
          detail: `Registry status is ${registry.implementationStatus}, not complete.`,
        });
      }
      if (registry.missingRules.length > 0) {
        addBlocker(blockers, {
          code: 'registry_missing_rules',
          engineName,
          detail: `Missing scoped rules: ${registry.missingRules.join('；')}`,
        });
      }
      if (!ACCEPTABLE_SOURCE_GRADES.has(registry.sourceGrade)) {
        addBlocker(blockers, {
          code: 'registry_source_grade_low',
          engineName,
          detail: `Registry source grade ${registry.sourceGrade} is below B.`,
        });
      }
      if (!hasStableSourceReference(registry.sourceUrls)) {
        addBlocker(blockers, {
          code: 'registry_source_reference_unstable',
          engineName,
          detail: 'Registry has no stable URL/DOI/ISBN/URN source reference.',
        });
      }
    }

    const validation = validateEngineOutput(output);
    if (!validation.ok) {
      addBlocker(blockers, {
        code: 'output_invalid',
        engineName,
        detail: validation.issues
          .filter((issue) => issue.severity === 'error')
          .map((issue) => `${issue.field}: ${issue.message}`)
          .join('; '),
      });
    }

    const status = getImplementationStatus(output);
    if (status !== 'complete') {
      addBlocker(blockers, {
        code: 'output_status_incomplete',
        engineName,
        detail: `Output status is ${status}, not complete.`,
      });
    }
    if (!ACCEPTABLE_SOURCE_GRADES.has(output.sourceGrade)) {
      addBlocker(blockers, {
        code: 'output_source_grade_low',
        engineName,
        detail: `Output source grade ${output.sourceGrade} is below B.`,
      });
    }
    if (output.completenessScore < minimumCompletenessScore) {
      addBlocker(blockers, {
        code: 'output_completeness_below_threshold',
        engineName,
        detail: `Completeness ${output.completenessScore} is below ${minimumCompletenessScore}.`,
      });
    }
    if (output.validationFlags.failed.length > 0) {
      addBlocker(blockers, {
        code: output.validationFlags.failed.includes('authoritative_core_failed')
          ? 'authoritative_core_failed'
          : 'output_validation_failed',
        engineName,
        detail: `Validation failures: ${output.validationFlags.failed.join(', ')}`,
      });
    }

    const explanation = checkExplanation(output);
    if (!explanation.ok) {
      addBlocker(blockers, {
        code: 'explanation_invalid',
        engineName,
        detail: explanation.problems.join('; '),
      });
    }
    if (!hasStableSourceReference(output.sourceUrls)) {
      addBlocker(blockers, {
        code: 'source_reference_unstable',
        engineName,
        detail: 'Output has no stable URL/DOI/ISBN/URN source reference.',
      });
    }
    if (output.normalizedOutput.registryPolicyApplied !== true) {
      addBlocker(blockers, {
        code: 'registry_policy_missing',
        engineName,
        detail: 'Audited registry policy was not recorded on output.',
      });
    }
    if (typeof output.normalizedOutput.authoritativeCoreError === 'string') {
      addBlocker(blockers, {
        code: 'authoritative_core_failed',
        engineName,
        detail: `Authoritative core failed: ${output.normalizedOutput.authoritativeCoreError}`,
      });
    } else if (typeof output.normalizedOutput.p4CoreVersion !== 'string') {
      addBlocker(blockers, {
        code: 'authoritative_core_missing',
        engineName,
        detail: 'No authoritative core version is attached to this output.',
      });
    }

    const unsafe: Array<{ path: string; value: string }> = [];
    collectUnsafeStringValues({
      eventCandidates: output.eventCandidates,
      normalizedOutput: output.normalizedOutput,
      warnings: output.warnings,
      uncertaintyNotes: output.uncertaintyNotes,
      explanationTrace: output.explanationTrace,
    }, '', unsafe, new Set());
    for (const finding of unsafe) {
      addBlocker(blockers, {
        code: 'sensitive_mortality_content',
        engineName,
        path: finding.path,
        detail: `Unsafe individualized mortality/lifespan claim detected: ${finding.value.slice(0, 120)}`,
      });
    }
  }

  // A registry entry that is not in the product's required engine set must not
  // silently disappear from a full-product release assessment.
  if (options.requiredEngines == null) {
    for (const registeredName of Object.keys(ALGORITHM_SOURCE_REGISTRY)) {
      if (!requiredEngines.includes(registeredName as EngineName)) {
        addBlocker(blockers, {
          code: 'required_engine_missing',
          engineName: registeredName,
          detail: 'Registered engine is absent from the canonical product engine list.',
        });
      }
    }
  }

  return {
    schemaVersion: 'commercial-readiness/v1',
    ready: blockers.length === 0,
    requiredEngines,
    auditedEngines: Array.from(byEngine.keys()).sort(),
    minimumCompletenessScore,
    blockers,
  };
}
