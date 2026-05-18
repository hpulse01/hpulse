/**
 * src/hpulse/ — new-generation H-Pulse core, parallel to src/core/ (P4).
 * Engines migrate in via adapters; do not import from this namespace inside
 * existing src/core or src/utils engine code without an explicit adapter.
 */
export * from "./input/normalize";
export * from "./input/types";
export * from "./weights";
export * from "./engines";
export * from "./worldtree";
export * from "./fusion";
export * from "./orchestrator";
export * from "./projection";
export * from "./react";
