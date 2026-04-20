// ============================================================================
// Supabase REST API (PostgREST) Adapter — Prisma-compatible DB client
// ============================================================================
// Wraps the Supabase REST API to expose the same interface as Prisma's db client.
// Used in production environments where direct PostgreSQL connections are blocked
// (e.g., Vercel serverless with IPv6-only Supabase).
//
// Supported operations:
//   count, findUnique, findFirst, findMany, create, createMany,
//   update, delete, aggregate, groupBy, $queryRaw (limited)
// ============================================================================

// ─── Configuration ──────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Prisma model name → actual PostgreSQL table name
// Prisma creates quoted identifiers, so the casing is preserved in Postgres.
const TABLE_NAMES: Record<string, string> = {
  user: "User",
  case: "Case",
  caseNote: "CaseNote",
  caseDocument: "CaseDocument",
  donation: "Donation",
  disbursement: "Disbursement",
  auditLog: "AuditLog",
  notification: "Notification",
  programme: "Programme",
};

// DateTime fields per model — these are deserialized from ISO strings to Date objects
// to match Prisma's behaviour.
const DATE_FIELDS: Record<string, string[]> = {
  user: ["lastLogin", "createdAt", "updatedAt"],
  case: [
    "verifiedAt",
    "approvedAt",
    "closedAt",
    "followUpDate",
    "createdAt",
    "updatedAt",
  ],
  caseNote: ["createdAt", "updatedAt"],
  caseDocument: ["createdAt"],
  donation: ["date", "createdAt", "updatedAt"],
  disbursement: [
    "scheduledDate",
    "processedDate",
    "createdAt",
    "updatedAt",
  ],
  auditLog: ["createdAt"],
  notification: ["createdAt"],
  programme: ["startDate", "endDate", "createdAt", "updatedAt"],
};

// ─── Relation metadata ─────────────────────────────────────────────────────

// For each model, the relations it can `include`/`select`.
type RelType = "one" | "many";

interface RelationDef {
  table: string; // target model name (lowercase key into TABLE_NAMES)
  type: RelType;
}

const RELATIONS: Record<string, Record<string, RelationDef>> = {
  case: {
    programme: { table: "programme", type: "one" },
    assignee: { table: "user", type: "one" },
    verifier: { table: "user", type: "one" },
    approver: { table: "user", type: "one" },
    caseNotes: { table: "caseNote", type: "many" },
    disbursements: { table: "disbursement", type: "many" },
    documents: { table: "caseDocument", type: "many" },
    donations: { table: "donation", type: "many" },
  },
  caseNote: {
    author: { table: "user", type: "one" },
    case: { table: "case", type: "one" },
  },
  caseDocument: {
    case: { table: "case", type: "one" },
    uploader: { table: "user", type: "one" },
  },
  donation: {
    programme: { table: "programme", type: "one" },
    case: { table: "case", type: "one" },
  },
  disbursement: {
    case: { table: "case", type: "one" },
    programme: { table: "programme", type: "one" },
    approver: { table: "user", type: "one" },
    processor: { table: "user", type: "one" },
  },
  programme: {
    creator: { table: "user", type: "one" },
  },
  auditLog: {
    user: { table: "user", type: "one" },
  },
  notification: {
    user: { table: "user", type: "one" },
  },
  user: {
    auditLogs: { table: "auditLog", type: "many" },
    assignedCases: { table: "case", type: "many" },
    caseNotes: { table: "caseNote", type: "many" },
    documents: { table: "caseDocument", type: "many" },
    approvedDisbursements: { table: "disbursement", type: "many" },
    processedDisbursements: { table: "disbursement", type: "many" },
    createdProgrammes: { table: "programme", type: "many" },
    verifiedCases: { table: "case", type: "many" },
    approvedCases: { table: "case", type: "many" },
    notifications: { table: "notification", type: "many" },
  },
};

// Which column in the *source* model points to the related table's `id`?
// e.g. case.programme → case.programmeId
const FK_MAP: Record<string, Record<string, string>> = {
  case: {
    programme: "programmeId",
    assignee: "assignedTo",
    verifier: "verifiedBy",
    approver: "approvedBy",
  },
  caseNote: { author: "authorId", case: "caseId" },
  caseDocument: { case: "caseId", uploader: "uploadedBy" },
  donation: { programme: "programmeId", case: "caseId" },
  disbursement: {
    case: "caseId",
    programme: "programmeId",
    approver: "approvedBy",
    processor: "processedBy",
  },
  programme: { creator: "createdBy" },
  auditLog: { user: "userId" },
  notification: { user: "userId" },
  user: {
    auditLogs: "userId",
    assignedCases: "assignedTo",
    caseNotes: "authorId",
    documents: "uploadedBy",
    approvedDisbursements: "approvedBy",
    processedDisbursements: "processedBy",
    createdProgrammes: "createdBy",
    verifiedCases: "verifiedBy",
    approvedCases: "approvedBy",
    notifications: "userId",
  },
};

// ─── PostgREST filter builder ──────────────────────────────────────────────

/**
 * Convert a Prisma `where` clause to an array of PostgREST query-string params.
 *
 * Mapping rules:
 *   { email: "x" }                → email=eq.x
 *   { email: { equals: "x" } }    → email=eq.x
 *   { status: { in: [...] } }     → status=in.(a,b)
 *   { amount: { gte: 100 } }      → amount=gte.100
 *   { name: { contains: "ah" } }  → name=ilike.*ah*
 *   { name: { startsWith: "A" }}  → name=ilike.A*
 *   { AND: [...] }                → multiple params (implicit AND)
 *   { OR: [...] }                 → or=(...),(...)
 *   { score: { not: null } }      → score=not.is.null
 */
function whereToFilters(
  where: Record<string, unknown> | undefined,
  out: string[] = [],
): string[] {
  if (!where) return out;

  for (const [key, raw] of Object.entries(where)) {
    // ── Logical operators ──────────────────────────────────────────────
    if (key === "AND") {
      const arr = Array.isArray(raw) ? raw : [raw];
      for (const item of arr) {
        if (typeof item === "object" && item !== null)
          whereToFilters(item as Record<string, unknown>, out);
      }
      continue;
    }

    if (key === "OR") {
      if (Array.isArray(raw)) {
        const branches: string[] = [];
        for (const item of raw) {
          if (typeof item === "object" && item !== null) {
            const parts: string[] = [];
            whereToFilters(item as Record<string, unknown>, parts);
            branches.push(`(${parts.join("&")})`);
          }
        }
        if (branches.length) out.push(`or=(${branches.join(",")})`);
      }
      continue;
    }

    if (key === "NOT") {
      if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
        for (const [nk, nv] of Object.entries(raw as Record<string, unknown>)) {
          if (nv === null) {
            out.push(`${nk}=not.is.null`);
          } else if (typeof nv === "object" && nv !== null) {
            // e.g. { field: { not: { in: [...] } } }
            const sub = nv as Record<string, unknown>;
            for (const [op, ov] of Object.entries(sub)) {
              if (op === "in") out.push(`${nk}=not.in.${encodeVal(ov)}`);
              else if (op === "equals" || op === "eq")
                out.push(`${nk}=neq.${encodeVal(ov)}`);
            }
          } else {
            out.push(`${nk}=neq.${encodeVal(nv)}`);
          }
        }
      }
      continue;
    }

    // ── Column filter (direct value or operator object) ────────────────
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      const ops = raw as Record<string, unknown>;
      for (const [op, val] of Object.entries(ops)) {
        switch (op) {
          case "equals":
          case "eq":
            out.push(`${key}=eq.${encodeVal(val)}`);
            break;
          case "not":
            if (val === null) out.push(`${key}=not.is.null`);
            else out.push(`${key}=neq.${encodeVal(val)}`);
            break;
          case "in":
            out.push(`${key}=in.${encodeVal(val)}`);
            break;
          case "notIn":
            out.push(`${key}=not.in.${encodeVal(val)}`);
            break;
          case "lt":
            out.push(`${key}=lt.${encodeVal(val)}`);
            break;
          case "lte":
            out.push(`${key}=lte.${encodeVal(val)}`);
            break;
          case "gt":
            out.push(`${key}=gt.${encodeVal(val)}`);
            break;
          case "gte":
            out.push(`${key}=gte.${encodeVal(val)}`);
            break;
          case "contains":
            out.push(`${key}=ilike.*${encodeLike(String(val))}*`);
            break;
          case "startsWith":
            out.push(`${key}=ilike.${encodeLike(String(val))}*`);
            break;
          case "endsWith":
            out.push(`${key}=ilike.*${encodeLike(String(val))}`);
            break;
          case "mode":
            // Prisma 'insensitive' — PostgREST ilike is already case-insensitive
            break;
          default:
            // Unknown operator — skip silently
            break;
        }
      }
    } else if (raw === null) {
      out.push(`${key}=is.null`);
    } else {
      // Shorthand: { field: value } → field=eq.value
      out.push(`${key}=eq.${encodeVal(raw)}`);
    }
  }

  return out;
}

/** Encode a value for use in a PostgREST filter. */
function encodeVal(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v.toString();
  if (typeof v === "number") return Number.isFinite(v) ? v.toString() : "null";
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v))
    return `(${v.map((x) => encodeVal(x)).join(",")})`;
  return String(v);
}

/** Encode a value that will be placed inside an ilike pattern (*val*). */
function encodeLike(s: string): string {
  // PostgREST special chars in ilike patterns: % is *, _ is not supported
  // Escape % so it becomes literal
  return s.replace(/%/g, "\\%").replace(/\*/g, "\\*");
}

// ─── Select / orderBy helpers ──────────────────────────────────────────────

interface ParsedSelect {
  /** Column names for PostgREST `select=` param (only scalar fields). */
  columns: string[];
  /** Relation includes to resolve separately. */
  includes: Record<string, any>;
  /** _count specification. */
  countIncludes?: Record<string, any>;
}

/**
 * Unify Prisma `select` and `include` into a single structure.
 * Both can carry relation selections (nested objects) and `_count`.
 */
function parseSelectAndInclude(
  sel?: Record<string, any>,
  inc?: Record<string, any>,
): ParsedSelect {
  const columns: string[] = [];
  const includes: Record<string, any> = {};
  let countIncludes: Record<string, any> | undefined;

  if (sel) {
    for (const [k, v] of Object.entries(sel)) {
      if (k === "_count") {
        countIncludes = v;
      } else if (v === true) {
        columns.push(k);
      } else if (typeof v === "object" && v !== null) {
        includes[k] = v;
      }
    }
  }

  if (inc) {
    for (const [k, v] of Object.entries(inc)) {
      if (k === "_count") {
        countIncludes = countIncludes ? { ...countIncludes, ...v } : v;
      } else {
        includes[k] = includes[k] ? { ...includes[k], ...v } : v;
      }
    }
  }

  return { columns, includes, countIncludes };
}

function orderByToRest(
  orderBy: Record<string, string> | Array<Record<string, string>>,
): string {
  if (Array.isArray(orderBy)) {
    return orderBy
      .map((o) => {
        const [f, d] = Object.entries(o)[0];
        return `${f}.${d}`;
      })
      .join(",");
  }
  const [f, d] = Object.entries(orderBy)[0];
  return `${f}.${d}`;
}

// ─── HTTP helper ───────────────────────────────────────────────────────────

interface FetchResult {
  data: any;
  count: number | null;
  status: number;
}

async function supabaseFetch(
  path: string,
  opts: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    prefer?: string[];
  } = {},
): Promise<FetchResult> {
  const {
    method = "GET",
    headers: extraHeaders = {},
    body,
    prefer = [],
  } = opts;

  const url = `${SUPABASE_REST_URL}${path}`;

  const hdrs: Record<string, string> = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (prefer.length) hdrs["Prefer"] = prefer.join(",");

  const res = await fetch(url, {
    method,
    headers: hdrs,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Extract count from Content-Range header (format: "0-9/100")
  const rangeHdr = res.headers.get("content-range");
  let count: number | null = null;
  if (rangeHdr) {
    const total = rangeHdr.split("/")[1];
    if (total && total !== "*") count = parseInt(total, 10);
  }

  const contentType = res.headers.get("content-type") || "";
  let data: any = null;
  if (contentType.includes("application/json")) {
    const txt = await res.text();
    if (txt) data = JSON.parse(txt);
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const msg =
      typeof data === "object"
        ? data?.message ?? data?.msg ?? data?.error ?? JSON.stringify(data)
        : String(data);
    throw new Error(
      `[SupabaseDB] ${res.status} on ${method} ${path} — ${msg}`,
    );
  }

  return { data, count, status: res.status };
}

// ─── Date parsing ──────────────────────────────────────────────────────────

function parseDates<T>(data: T, fields: string[]): T {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data))
    return data.map((item) => parseDates(item, fields)) as T;
  const out = { ...(data as Record<string, unknown>) };
  for (const f of fields) {
    if (out[f] && typeof out[f] === "string") {
      out[f] = new Date(out[f] as string);
    }
  }
  return out as T;
}

function serializeDates(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Date) out[k] = v.toISOString();
    else if (v !== undefined) out[k] = v;
    // skip undefined
  }
  return out;
}

// ─── Model Delegate ────────────────────────────────────────────────────────

type IncludeOpts = Record<string, any>;

class SupabaseModelDelegate {
  private readonly modelName: string;
  private readonly tableName: string;
  private readonly dateFields: string[];

  constructor(modelName: string) {
    this.modelName = modelName;
    this.tableName = TABLE_NAMES[modelName] ?? modelName;
    this.dateFields = DATE_FIELDS[modelName] ?? [];
  }

  private get base(): string {
    return `/${this.tableName}`;
  }

  // ── count ──────────────────────────────────────────────────────────

  async count(args?: { where?: Record<string, any> }): Promise<number> {
    const filters: string[] = [];
    whereToFilters(args?.where, filters);

    const qs = filters.length ? `?${filters.join("&")}` : "";
    const { count } = await supabaseFetch(`${this.base}${qs}`, {
      method: "GET",
      headers: { Range: "0-0" },
      prefer: ["count=exact"],
    });
    return count ?? 0;
  }

  // ── findUnique ─────────────────────────────────────────────────────

  async findUnique<T = any>(args: {
    where: Record<string, any>;
    select?: Record<string, any>;
    include?: Record<string, any>;
  }): Promise<T | null> {
    const { columns, includes, countIncludes } = parseSelectAndInclude(
      args.select,
      args.include,
    );

    const filters: string[] = [];
    whereToFilters(args.where, filters);

    // Only set PostgREST select= if there are no includes to resolve
    // (includes need all columns to look up FK values)
    if (columns.length > 0 && Object.keys(includes).length === 0) {
      filters.unshift(`select=${columns.join(",")}`);
    }
    filters.push("limit=1");

    const qs = `?${filters.join("&")}`;
    const { data } = await supabaseFetch(`${this.base}${qs}`, {
      prefer: ["count=exact"],
    });

    if (!data || !Array.isArray(data) || data.length === 0) return null;

    let row = parseDates(data[0], this.dateFields);

    if (Object.keys(includes).length || countIncludes) {
      row = await this._resolveIncludesForOne(row, includes, countIncludes);
    }

    return row as T;
  }

  // ── findFirst ──────────────────────────────────────────────────────

  async findFirst<T = any>(args: {
    where?: Record<string, any>;
    select?: Record<string, any>;
    orderBy?: Record<string, string> | Array<Record<string, string>>;
    include?: Record<string, any>;
  }): Promise<T | null> {
    const { columns, includes, countIncludes } = parseSelectAndInclude(
      args.select,
      args.include,
    );

    const filters: string[] = [];
    if (args.where) whereToFilters(args.where, filters);
    if (args.orderBy) filters.push(`order=${orderByToRest(args.orderBy)}`);

    if (columns.length > 0 && Object.keys(includes).length === 0) {
      filters.unshift(`select=${columns.join(",")}`);
    }
    filters.push("limit=1");

    const qs = `?${filters.join("&")}`;
    const { data } = await supabaseFetch(`${this.base}${qs}`);

    if (!data || !Array.isArray(data) || data.length === 0) return null;

    let row = parseDates(data[0], this.dateFields);

    if (Object.keys(includes).length || countIncludes) {
      row = await this._resolveIncludesForOne(row, includes, countIncludes);
    }

    return row as T;
  }

  // ── findMany ───────────────────────────────────────────────────────

  async findMany<T = any>(args: {
    where?: Record<string, any>;
    select?: Record<string, any>;
    orderBy?: Record<string, string> | Array<Record<string, string>>;
    skip?: number;
    take?: number;
    include?: Record<string, any>;
  }): Promise<T[]> {
    const { columns, includes, countIncludes } = parseSelectAndInclude(
      args.select,
      args.include,
    );

    const filters: string[] = [];
    if (args.where) whereToFilters(args.where, filters);
    if (args.orderBy) filters.push(`order=${orderByToRest(args.orderBy)}`);
    if (args.skip != null) filters.push(`offset=${args.skip}`);
    if (args.take != null) filters.push(`limit=${args.take}`);

    // Column selection: only apply when no includes need resolution
    if (columns.length > 0 && Object.keys(includes).length === 0) {
      filters.unshift(`select=${columns.join(",")}`);
    }

    const qs = filters.length ? `?${filters.join("&")}` : "";
    const { data } = await supabaseFetch(`${this.base}${qs}`);

    if (!data || !Array.isArray(data)) return [];

    let rows: any[] = parseDates(data, this.dateFields);

    // Batch-resolve includes (efficient: one query per relation type)
    if (Object.keys(includes).length || countIncludes) {
      rows = await this._resolveIncludesBatch(
        rows,
        includes,
        countIncludes,
      );
    }

    return rows as T[];
  }

  // ── create ─────────────────────────────────────────────────────────

  async create<T = any>(args: {
    data: Record<string, any>;
    select?: Record<string, any>;
    include?: Record<string, any>;
  }): Promise<T> {
    const { columns, includes, countIncludes } = parseSelectAndInclude(
      args.select,
      args.include,
    );

    const body = serializeDates(args.data);

    let path = this.base;
    if (columns.length > 0 && Object.keys(includes).length === 0) {
      path += `?select=${columns.join(",")}`;
    }

    const { data } = await supabaseFetch(path, {
      method: "POST",
      prefer: ["return=representation"],
      body,
    });

    let row = parseDates(
      Array.isArray(data) ? data[0] : data,
      this.dateFields,
    );

    if (Object.keys(includes).length || countIncludes) {
      row = await this._resolveIncludesForOne(row, includes, countIncludes);
    }

    return row as T;
  }

  // ── createMany ─────────────────────────────────────────────────────

  async createMany(args: {
    data: Record<string, any>[];
    skipDuplicates?: boolean;
  }): Promise<{ count: number }> {
    const serialized = args.data.map((d) => serializeDates(d));

    const prefers: string[] = ["return=representation"];
    if (args.skipDuplicates) prefers.push("resolution=merge-duplicates");

    try {
      const { data } = await supabaseFetch(this.base, {
        method: "POST",
        prefer: prefers,
        body: serialized,
      });

      return { count: Array.isArray(data) ? data.length : 0 };
    } catch (err) {
      // If skipDuplicates and we hit a unique-constraint error, insert one-by-one
      if (args.skipDuplicates && String(err).includes("unique")) {
        let inserted = 0;
        for (const row of serialized) {
          try {
            await supabaseFetch(this.base, {
              method: "POST",
              prefer: ["return=representation"],
              body: row,
            });
            inserted++;
          } catch {
            // skip duplicate
          }
        }
        return { count: inserted };
      }
      throw err;
    }
  }

  // ── update ─────────────────────────────────────────────────────────

  async update<T = any>(args: {
    where: Record<string, any>;
    data: Record<string, any>;
    select?: Record<string, any>;
    include?: Record<string, any>;
  }): Promise<T> {
    const { columns, includes, countIncludes } = parseSelectAndInclude(
      args.select,
      args.include,
    );

    const filters: string[] = [];
    whereToFilters(args.where, filters);

    if (columns.length > 0 && Object.keys(includes).length === 0) {
      filters.unshift(`select=${columns.join(",")}`);
    }

    const body = serializeDates(args.data);
    const qs = filters.length ? `?${filters.join("&")}` : "";

    const { data } = await supabaseFetch(`${this.base}${qs}`, {
      method: "PATCH",
      prefer: ["return=representation"],
      body,
    });

    let row: any = Array.isArray(data) ? data[0] : data;
    row = parseDates(row, this.dateFields);

    if (Object.keys(includes).length || countIncludes) {
      row = await this._resolveIncludesForOne(row, includes, countIncludes);
    }

    return row as T;
  }

  // ── delete ─────────────────────────────────────────────────────────

  async delete<T = any>(args: {
    where: Record<string, any>;
    select?: Record<string, any>;
  }): Promise<T> {
    const filters: string[] = [];
    whereToFilters(args.where, filters);

    const sel = args.select ? selectToRest(args.select) : null;
    if (sel) filters.unshift(`select=${sel}`);

    const qs = filters.length ? `?${filters.join("&")}` : "";

    const { data } = await supabaseFetch(`${this.base}${qs}`, {
      method: "DELETE",
      prefer: ["return=representation"],
    });

    return (Array.isArray(data) ? data[0] : data) as T;
  }

  // ── aggregate ──────────────────────────────────────────────────────

  async aggregate(args: {
    where?: Record<string, any>;
    _sum?: Record<string, boolean>;
    _count?: boolean | Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
  }): Promise<any> {
    const rows = await this.findMany({ where: args.where });
    const result: any = {};

    // _count
    if (args._count !== undefined) {
      if (args._count === true) {
        result._count = rows.length;
      } else {
        result._count = {};
        for (const [col, enabled] of Object.entries(args._count)) {
          if (enabled) {
            result._count[col] = rows.filter(
              (r: any) => r[col] != null,
            ).length;
          }
        }
      }
    }

    // _sum
    if (args._sum) {
      result._sum = {};
      for (const [col, enabled] of Object.entries(args._sum)) {
        if (enabled)
          result._sum[col] = rows.reduce(
            (s: number, r: any) => s + (Number(r[col]) || 0),
            0,
          );
      }
    }

    // _avg
    if (args._avg) {
      result._avg = {};
      for (const [col, enabled] of Object.entries(args._avg)) {
        if (enabled) {
          const valid = rows.filter((r: any) => r[col] != null);
          result._avg[col] =
            valid.length > 0
              ? valid.reduce(
                  (s: number, r: any) => s + Number(r[col]),
                  0,
                ) / valid.length
              : null;
        }
      }
    }

    // _min
    if (args._min) {
      result._min = {};
      for (const [col, enabled] of Object.entries(args._min)) {
        if (enabled) {
          const vals = rows
            .map((r: any) => r[col])
            .filter((v: any) => v != null && typeof v === "number");
          result._min[col] = vals.length > 0 ? Math.min(...vals) : null;
        }
      }
    }

    // _max
    if (args._max) {
      result._max = {};
      for (const [col, enabled] of Object.entries(args._max)) {
        if (enabled) {
          const vals = rows
            .map((r: any) => r[col])
            .filter((v: any) => v != null && typeof v === "number");
          result._max[col] = vals.length > 0 ? Math.max(...vals) : null;
        }
      }
    }

    return result;
  }

  // ── groupBy ────────────────────────────────────────────────────────

  async groupBy(args: {
    by: string[];
    where?: Record<string, any>;
    _count?: boolean | Record<string, boolean>;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
    orderBy?: Record<string, string> | Array<Record<string, string>>;
    take?: number;
  }): Promise<any[]> {
    // Fetch all matching rows then group in JS
    const fetchOpts: any = { where: args.where };
    if (args.orderBy) fetchOpts.orderBy = args.orderBy;
    if (args.take) fetchOpts.take = args.take;

    const rows = await this.findMany(fetchOpts);

    // Group
    const groups = new Map<string, any[]>();
    for (const row of rows) {
      const key = args.by
        .map((col) => JSON.stringify((row as any)[col]))
        .join("\x00");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const results: any[] = [];
    for (const [key, groupRows] of groups) {
      const groupKeys = JSON.parse(`[${key}]`);
      const item: any = {};

      // Group-by column values
      args.by.forEach((col, i) => {
        item[col] = groupKeys[i];
      });

      // _count
      if (args._count !== undefined) {
        if (args._count === true) {
          item._count = groupRows.length;
        } else {
          item._count = {};
          for (const [col, enabled] of Object.entries(args._count)) {
            if (enabled)
              item._count[col] = groupRows.filter(
                (r: any) => r[col] != null,
              ).length;
          }
        }
      }

      // _sum
      if (args._sum) {
        item._sum = {};
        for (const [col, enabled] of Object.entries(args._sum)) {
          if (enabled)
            item._sum[col] = groupRows.reduce(
              (s: number, r: any) => s + (Number(r[col]) || 0),
              0,
            );
        }
      }

      // _avg
      if (args._avg) {
        item._avg = {};
        for (const [col, enabled] of Object.entries(args._avg)) {
          if (enabled) {
            const valid = groupRows.filter((r: any) => r[col] != null);
            item._avg[col] =
              valid.length > 0
                ? valid.reduce(
                    (s: number, r: any) => s + Number(r[col]),
                    0,
                  ) / valid.length
                : null;
          }
        }
      }

      // _min
      if (args._min) {
        item._min = {};
        for (const [col, enabled] of Object.entries(args._min)) {
          if (enabled) {
            const vals = groupRows
              .map((r: any) => r[col])
              .filter((v: any) => v != null && typeof v === "number");
            item._min[col] = vals.length > 0 ? Math.min(...vals) : null;
          }
        }
      }

      // _max
      if (args._max) {
        item._max = {};
        for (const [col, enabled] of Object.entries(args._max)) {
          if (enabled) {
            const vals = groupRows
              .map((r: any) => r[col])
              .filter((v: any) => v != null && typeof v === "number");
            item._max[col] = vals.length > 0 ? Math.max(...vals) : null;
          }
        }
      }

      results.push(item);
    }

    return results;
  }

  // ── Include resolution (single row) ────────────────────────────────

  private async _resolveIncludesForOne(
    row: any,
    includes: IncludeOpts,
    countIncludes?: Record<string, any>,
  ): Promise<any> {
    const result = { ...row };
    const modelRels = RELATIONS[this.modelName];
    const modelFKs = FK_MAP[this.modelName];

    // Resolve relations
    for (const [relName, relOpts] of Object.entries(includes)) {
      const relDef = modelRels?.[relName];
      if (!relDef) {
        console.warn(
          `[SupabaseDB] Unknown relation "${relName}" on "${this.modelName}"`,
        );
        continue;
      }

      const fkCol = modelFKs?.[relName];
      if (!fkCol) continue;

      const delegate = new SupabaseModelDelegate(relDef.table);

      if (relDef.type === "one") {
        const fkVal = row[fkCol];
        if (fkVal) {
          result[relName] = await delegate.findUnique({
            where: { id: fkVal },
            select: relOpts?.select,
          });
        } else {
          result[relName] = null;
        }
      } else {
        // many
        const manyArgs: any = { where: { [fkCol]: row.id } };
        if (relOpts?.select) manyArgs.select = relOpts.select;
        if (relOpts?.orderBy) manyArgs.orderBy = relOpts.orderBy;
        if (relOpts?.take != null) manyArgs.take = relOpts.take;
        result[relName] = await delegate.findMany(manyArgs);
      }
    }

    // Resolve _count
    if (countIncludes) {
      result._count = {};
      const countSelect =
        typeof countIncludes === "object" && countIncludes.select
          ? countIncludes.select
          : countIncludes;

      for (const [relName, enabled] of Object.entries(countSelect)) {
        if (!enabled) continue;
        const relDef = modelRels?.[relName];
        if (!relDef) continue;
        const fkCol = modelFKs?.[relName];
        if (!fkCol) continue;

        if (relDef.type === "many") {
          result._count[relName] = await new SupabaseModelDelegate(
            relDef.table,
          ).count({ where: { [fkCol]: row.id } });
        }
      }
    }

    return result;
  }

  // ── Include resolution (batched for findMany) ──────────────────────

  private async _resolveIncludesBatch(
    rows: any[],
    includes: IncludeOpts,
    countIncludes?: Record<string, any>,
  ): Promise<any[]> {
    if (rows.length === 0) return rows;

    const modelRels = RELATIONS[this.modelName];
    const modelFKs = FK_MAP[this.modelName];

    // ── Batch "one" relations ─────────────────────────────────────────
    for (const [relName, relOpts] of Object.entries(includes)) {
      const relDef = modelRels?.[relName];
      if (!relDef || relDef.type !== "one") continue;
      const fkCol = modelFKs?.[relName];
      if (!fkCol) continue;

      // Collect unique FK values
      const fkValues = [
        ...new Set(
          rows.map((r) => r[fkCol]).filter((v) => v != null && v !== ""),
        ),
      ];
      if (fkValues.length === 0) {
        for (const r of rows) r[relName] = null;
        continue;
      }

      const delegate = new SupabaseModelDelegate(relDef.table);
      const relatedRows = await delegate.findMany({
        where: { id: { in: fkValues } },
        select: relOpts?.select,
      });

      const lookup = new Map(relatedRows.map((r: any) => [r.id, r]));
      for (const r of rows) {
        r[relName] = r[fkCol] ? lookup.get(r[fkCol]) ?? null : null;
      }
    }

    // ── Batch "many" relations ────────────────────────────────────────
    for (const [relName, relOpts] of Object.entries(includes)) {
      const relDef = modelRels?.[relName];
      if (!relDef || relDef.type !== "many") continue;
      const fkCol = modelFKs?.[relName];
      if (!fkCol) continue;

      const parentIds = rows.map((r) => r.id);
      const delegate = new SupabaseModelDelegate(relDef.table);
      const manyArgs: any = {
        where: { [fkCol]: { in: parentIds } },
        select: relOpts?.select,
      };
      if (relOpts?.orderBy) manyArgs.orderBy = relOpts.orderBy;
      if (relOpts?.take != null) manyArgs.take = relOpts.take;

      const relatedRows = await delegate.findMany(manyArgs);

      // Group by FK
      const grouped = new Map<string, any[]>();
      for (const rr of relatedRows) {
        const key = (rr as any)[fkCol];
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(rr);
      }

      for (const r of rows) {
        r[relName] = grouped.get(r.id) ?? [];
      }
    }

    // ── Batch _count ──────────────────────────────────────────────────
    if (countIncludes) {
      const countSelect =
        typeof countIncludes === "object" && countIncludes.select
          ? countIncludes.select
          : countIncludes;

      for (const [relName, enabled] of Object.entries(countSelect)) {
        if (!enabled) continue;
        const relDef = modelRels?.[relName];
        if (!relDef || relDef.type !== "many") continue;
        const fkCol = modelFKs?.[relName];
        if (!fkCol) continue;

        const parentIds = rows.map((r) => r.id);

        // Efficient: fetch only the FK column, then count in JS
        const delegate = new SupabaseModelDelegate(relDef.table);
        const fkRows = await delegate.findMany({
          where: { [fkCol]: { in: parentIds } },
          select: { [fkCol]: true },
        });

        const countMap = new Map<string, number>();
        for (const r of fkRows as any[]) {
          const k = r[fkCol];
          countMap.set(k, (countMap.get(k) ?? 0) + 1);
        }

        for (const r of rows) {
          if (!r._count) r._count = {};
          r._count[relName] = countMap.get(r.id) ?? 0;
        }
      }
    }

    return rows;
  }
}

// ─── Legacy helper (used inside this file only) ───────────────────────────

function selectToRest(select: Record<string, any>): string {
  const cols: string[] = [];
  for (const [k, v] of Object.entries(select)) {
    if (v === true && k !== "_count") cols.push(k);
  }
  return cols.join(",");
}

// ─── Main DB client ────────────────────────────────────────────────────────

class SupabaseDbClient {
  // One delegate per model — mirrors Prisma's db.user, db.case, etc.
  user = new SupabaseModelDelegate("user");
  case = new SupabaseModelDelegate("case");
  caseNote = new SupabaseModelDelegate("caseNote");
  caseDocument = new SupabaseModelDelegate("caseDocument");
  donation = new SupabaseModelDelegate("donation");
  disbursement = new SupabaseModelDelegate("disbursement");
  auditLog = new SupabaseModelDelegate("auditLog");
  notification = new SupabaseModelDelegate("notification");
  programme = new SupabaseModelDelegate("programme");

  // ── $queryRaw — limited pattern matching ────────────────────────────
  //
  // The codebase uses $queryRaw with SQLite-specific SQL for monthly
  // aggregations and avg processing time.  On PostgreSQL/Supabase these
  // queries would not run anyway (strftime → TO_CHAR, julianday → plain
  // date math), so we translate the *intent* into REST calls.

  async $queryRaw<T = any>(
    strings: TemplateStringsArray,
    ..._values: any[]
  ): Promise<T[]> {
    const sql = strings.join("");

    // Monthly donation totals
    if (
      sql.includes("strftime") &&
      sql.includes("Donation") &&
      sql.includes("month") &&
      sql.includes("SUM(amount)")
    ) {
      return this._monthlyAggregation<T>("donation", "date", "confirmed");
    }

    // Monthly disbursement totals
    if (
      sql.includes("strftime") &&
      sql.includes("Disbursement") &&
      sql.includes("month") &&
      sql.includes("SUM(amount)")
    ) {
      return this._monthlyAggregation<T>(
        "disbursement",
        "processedDate",
        "completed",
      );
    }

    // Average processing days (closedAt − createdAt)
    if (sql.includes("AVG") && sql.includes("closedAt") && sql.includes("createdAt")) {
      return this._avgProcessingDays<T>();
    }

    throw new Error(
      `[SupabaseDB] $queryRaw is not supported for arbitrary SQL on the REST API.\n` +
        `SQL snippet: ${sql.substring(0, 120)}…\n` +
        `Consider: Supabase RPC (stored procedure), or rewrite using aggregate/groupBy.`,
    );
  }

  private async _monthlyAggregation<T>(
    model: string,
    dateCol: string,
    statusVal: string,
  ): Promise<T[]> {
    const rows = await new SupabaseModelDelegate(model).findMany({
      where: { status: statusVal },
    });

    const monthMap = new Map<string, number>();
    for (const r of rows as any[]) {
      const d = new Date(r[dateCol]);
      if (isNaN(d.getTime())) continue;
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(m, (monthMap.get(m) ?? 0) + (Number(r.amount) || 0));
    }

    return Array.from(monthMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12) as T[];
  }

  private async _avgProcessingDays<T>(): Promise<T[]> {
    const rows = await new SupabaseModelDelegate("case").findMany({
      where: { status: "closed", closedAt: { not: null } },
    });

    let totalDays = 0;
    let n = 0;
    for (const r of rows as any[]) {
      if (r.closedAt && r.createdAt) {
        totalDays +=
          (new Date(r.closedAt).getTime() - new Date(r.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        n++;
      }
    }

    return [{ avg_days: n > 0 ? totalDays / n : 0 }] as T[];
  }

  // ── Lifecycle no-ops (REST is stateless) ────────────────────────────

  async $connect(): Promise<void> {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error(
        "[SupabaseDB] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.",
      );
    }
  }

  async $disconnect(): Promise<void> {
    // no-op
  }
}

// ─── Exports ───────────────────────────────────────────────────────────────

export const createSupabaseClient = (): SupabaseDbClient =>
  new SupabaseDbClient();

export { SupabaseDbClient };
