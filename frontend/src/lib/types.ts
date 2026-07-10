export interface User {
  id: string;
  email: string;
  name: string;
  account_id: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type ZoneType = "Public" | "Private";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  comment: string;
  record_count: number;
  created_at: string;
}

export const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "TXT",
  "MX",
  "NS",
  "PTR",
  "SRV",
  "CAA",
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export interface DnsRecord {
  id: string;
  zone_id: string;
  name: string;
  type: RecordType;
  value: string;
  ttl: number;
  routing_policy: string;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateZoneInput {
  name: string;
  type: ZoneType;
  comment: string;
}

export interface CreateRecordInput {
  name: string;
  type: RecordType;
  value: string;
  ttl: number;
  routing_policy: string;
}

export interface UpdateRecordInput {
  name?: string;
  type?: RecordType;
  value?: string;
  ttl?: number;
  routing_policy?: string;
}

export interface ListParams {
  search?: string;
  type?: string;
  page?: number;
  page_size?: number;
}
