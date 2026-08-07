export interface EventEnvelope<TType extends string = string, TPayload = unknown> {
  id: string;
  type: TType;
  source: string;
  version: number;
  companyId: number | null;
  userId: string | null;
  occurredAt: string;
  payload: TPayload;
  metadata: Record<string, unknown>;
}