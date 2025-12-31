export type MergeOptions = {
  arrayStrategy?: "replace" | "concat";
  depthLimit?: number;
  ignoreKeys?: string[];
  preserveUndefined?: boolean;
  customMerge?: (key: string, val1: any, val2: any) => any;
  dateStrategy?: "copy" | "stringify" | "timestamp";
  overwriteFalsy?: boolean;
  cloneInputs?: boolean;
};

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(value: any): value is Record<string, any> {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  return Object.prototype.toString.call(value) === "[object Object]";
}

export function deepMerge<T = any>(
  target: T,
  source: T,
  options: MergeOptions = {},
): T {
  const {
    arrayStrategy = "replace",
    depthLimit = Infinity,
    ignoreKeys = [],
    preserveUndefined = false,
    customMerge,
    dateStrategy = "copy",
    overwriteFalsy = true,
    cloneInputs = true,
  } = options;

  if (depthLimit === 0) return source;

  if (!isPlainObject(source)) return source;

  const targetObject = isPlainObject(target) ? target : ({} as T);
  const result = cloneInputs ? { ...targetObject } : targetObject;

  for (const key of Object.keys(source)) {
    if (UNSAFE_KEYS.has(key)) continue;
    if (ignoreKeys.includes(key)) continue;

    const val1 = (result as any)[key];
    const val2 = (source as any)[key];

    if (customMerge) {
      (result as any)[key] = customMerge(key, val1, val2);
      continue;
    }

    if (val2 instanceof Date) {
      switch (dateStrategy) {
        case "stringify":
          (result as any)[key] = val2.toISOString();
          break;
        case "timestamp":
          (result as any)[key] = val2.getTime();
          break;
        default:
          (result as any)[key] = new Date(val2.getTime());
      }
      continue;
    }

    if (isPlainObject(val2)) {
      (result as any)[key] = deepMerge(val1 || {}, val2, {
        arrayStrategy,
        depthLimit: depthLimit - 1,
        ignoreKeys,
        preserveUndefined,
        customMerge,
        dateStrategy,
        overwriteFalsy,
        cloneInputs,
      });
    } else if (Array.isArray(val2)) {
      if (arrayStrategy === "concat" && Array.isArray(val1)) {
        (result as any)[key] = [...val1, ...val2];
      } else {
        (result as any)[key] = val2;
      }
    } else {
      if (val2 === undefined && !preserveUndefined) continue;
      if (!overwriteFalsy && val2 == null) continue;
      (result as any)[key] = val2;
    }
  }

  return result;
}

export function mergeMany(objects: object[], options?: MergeOptions) {
  return objects.reduce((acc, obj) => deepMerge(acc, obj, options), {});
}
