# Ziwei Doushu — External Reference Corpus

Frozen knowledge dump imported from
[`hpulse01/ziwei-doushu`](https://github.com/hpulse01/ziwei-doushu)
(forked from `Renhuai123/ziwei-doushu`, MIT-style classical-text repository).

Files are stored with `.ts.txt` extension so the TypeScript compiler ignores
them — they are **not** part of the runtime. They serve two purposes:

1. **Reference / training corpus** — parsed by
   `scripts/build-ziwei-corpus.ts` into `/mnt/documents/ziwei_training.jsonl`
   and seeded into the `ziwei_corpus` Supabase table (RAG layer for the
   AI interpretation engine).
2. **Algorithm cross-validation** — the original `patterns.ts` / `sihua.ts`
   logic can be cross-referenced against our deterministic P4 core
   (`src/core/ziwei/`) when expanding格局识别/四化解释.

## Layout
- `ziwei/`     — 紫微主算法 + 格局 + 四化 + 名人案例 + 历史
- `nihai/`     — 倪海厦《天纪》三才（天机/地机/人机）讲义体系
- `classics/`  — 骨髓赋 / 紫微斗数全集 / 全书 古籍语料

## Provenance
Upstream commit fetched on 2026-06-07. Texts are public-domain Ming-dynasty
classics + contemporary derivative commentary. Do not edit these files
in-place; if upstream changes, re-run the importer.
