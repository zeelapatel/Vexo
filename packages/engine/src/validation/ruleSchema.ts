import type { ComponentCategory } from '@vexo/types';
import type { VexoNode } from '@vexo/types';

export type RuleLayer = 1 | 2 | 3;

export interface ValidationResult {
  blocked: boolean;
  warned: boolean;
  reason?: string;
  warningMessage?: string;
  suggestedFix?: string;
  ruleId?: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  layer: RuleLayer;
  sourceCategories: ComponentCategory[];
  targetCategories: ComponentCategory[];
  sourceTypes?: string[];
  targetTypes?: string[];
  condition?: (source: VexoNode, target: VexoNode) => boolean;
  message: string;
  suggestedFix?: string;
}

export const VALID: ValidationResult = { blocked: false, warned: false };

export class RuleEngine {
  private rules: ValidationRule[];

  constructor(rules: ValidationRule[]) {
    this.rules = rules;
  }

  evaluate(source: VexoNode, target: VexoNode): ValidationResult {
    for (const rule of this.rules) {
      // Check category match
      const srcCatMatch =
        rule.sourceCategories.length === 0 ||
        rule.sourceCategories.includes(source.data.category);
      const tgtCatMatch =
        rule.targetCategories.length === 0 ||
        rule.targetCategories.includes(target.data.category);

      if (!srcCatMatch || !tgtCatMatch) continue;

      // Check type match if specified
      if (rule.sourceTypes && rule.sourceTypes.length > 0) {
        if (!rule.sourceTypes.some((t) => source.data.componentId.includes(t))) continue;
      }
      if (rule.targetTypes && rule.targetTypes.length > 0) {
        if (!rule.targetTypes.some((t) => target.data.componentId.includes(t))) continue;
      }

      // Evaluate condition if present
      if (rule.condition && !rule.condition(source, target)) continue;

      // Rule matched
      if (rule.layer === 1) {
        return {
          blocked: true,
          warned: false,
          reason: rule.message,
          suggestedFix: rule.suggestedFix,
          ruleId: rule.id,
        };
      }
      if (rule.layer === 2 || rule.layer === 3) {
        return {
          blocked: false,
          warned: true,
          warningMessage: rule.message,
          suggestedFix: rule.suggestedFix,
          ruleId: rule.id,
        };
      }
    }
    return VALID;
  }

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  getRules(): ValidationRule[] {
    return this.rules;
  }
}
