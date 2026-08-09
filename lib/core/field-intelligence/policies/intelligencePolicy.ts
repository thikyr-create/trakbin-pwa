// lib/core/field-intelligence/policies/intelligencePolicy.ts
/** When may the VRP consume a learned value? */
export const intelligencePolicy = {
  maxAgeDays: 30,
  minConfidence: 0.7,

  canConsume(record: { confidence: number; status: string; updated_at?: string }): boolean {
    if (record.status !== 'active') return false;
    if (record.confidence < this.minConfidence) return false;
    if (record.updated_at) {
      const age = Date.now() - new Date(record.updated_at).getTime();
      if (age > this.maxAgeDays * 864e5) return false;
    }
    return true;
  },
};