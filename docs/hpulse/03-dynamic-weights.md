# HPU-3 · 多元动态权重命理引擎 (DynamicWeightCalculator)

> 链接: Linear HPU-3 · Phase 2 · 状态 Backlog → 本仓库已落地 v1.0.0 TS MVP

## 唯一目的
把多个体系的独立观察结果，在同一 `(t, e, d)` 坐标下转化为可比较、可加权、可融合、可解释的统一判断。没有 W，系统只是多个算法的拼贴。

## 核心公式
```
W_i(t,e,d) = α_i(t) · β_i(e) · γ_i(d) / Σ_j[ α_j(t) · β_j(e) · γ_j(d) ]
```

- `α_i(t)`：体系 *i* 在时间阶段 *t* 的能力系数（natal 引擎在 natal 时段强；instant 引擎在即时查询强）
- `β_i(e)`：体系 *i* 对事件类型 *e* 的擅长度
- `γ_i(d)`：体系 *i* 对粒度 *d* 的精度匹配
- 分母用所有可用体系求和，自动归一为 Σ W = 1
- 若某体系不可用 → 从分母剔除并写入 `degraded_engines`，权重自动重分配

## 维度枚举（v1.0.0）

| 轴 | 取值 |
|---|---|
| 时间阶段 t | `childhood` (0-12) · `youth` (13-29) · `prime` (30-44) · `middle` (45-59) · `elder` (60+) |
| 事件 e | `career` · `wealth` · `love` · `health` · `crisis` · `decision` · `migration` · `general` |
| 粒度 d | `minute` · `hour` · `day` · `week` · `month` · `year` · `decade` |

## 注册体系（10 个，含 P3 已实现的 8 个 + 2 个全球系统）

`bazi · ziwei · liuyao · qimen · daliuren · taiyi · tieban · meihua · astrology · numerology`

## 矩阵版本化
`matrix_version = "wmat-1.0.0"`，进入 `algorithm_version` 体系，可回滚、可审计。所有矩阵值定义在 `src/hpulse/weights/matrix-v1.ts`，纯数据、纯函数、可复现。

## 验收
- 同输入同版本 → 完全相同的 `weights` 向量（确定性）
- 不同 e/d 产生不同主导体系（如 `crisis+minute` → 奇门遁甲主导；`career+year` → 八字主导）
- 任一体系不可用 → 剩余体系归一 + 记录 `degraded_reason`
- 输出可序列化、可审计、可前端可视化
