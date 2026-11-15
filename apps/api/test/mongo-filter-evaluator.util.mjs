/**
 * In-memory MongoDB query filter evaluator for automated testing of aggregation & update filters.
 * Evaluates standard operators ($and, $or, $nor, $expr, $exists, $in, $nin, $ne, $eq).
 */

function evaluateExpr(expr, doc) {
  if (expr.$ne) {
    const [leftRef, rightRef] = expr.$ne;
    const leftVal = typeof leftRef === 'string' && leftRef.startsWith('$') ? doc[leftRef.slice(1)] : leftRef;
    const rightVal = typeof rightRef === 'string' && rightRef.startsWith('$') ? doc[rightRef.slice(1)] : rightRef;
    return leftVal !== rightVal;
  }
  if (expr.$eq) {
    const [leftRef, rightRef] = expr.$eq;
    const leftVal = typeof leftRef === 'string' && leftRef.startsWith('$') ? doc[leftRef.slice(1)] : leftRef;
    const rightVal = typeof rightRef === 'string' && rightRef.startsWith('$') ? doc[rightRef.slice(1)] : rightRef;
    return leftVal === rightVal;
  }
  throw new Error(`Unsupported expression operator: ${JSON.stringify(expr)}`);
}

function matchFieldOperator(op, opVal, actual, hasKey) {
  if (op === '$exists') {
    return opVal ? hasKey : !hasKey;
  }
  if (op === '$in') {
    return Array.isArray(opVal) && opVal.some((v) => (v === null && !hasKey) || actual === v);
  }
  if (op === '$nin') {
    return Array.isArray(opVal) && !opVal.some((v) => (v === null && !hasKey) || actual === v);
  }
  if (op === '$ne') {
    return actual !== opVal;
  }
  if (op === '$eq') {
    return actual === opVal;
  }
  throw new Error(`Unsupported field operator: ${op}`);
}

export function matchesMongoFilter(filter, doc) {
  if (!filter || Object.keys(filter).length === 0) {
    return true;
  }

  for (const [key, expected] of Object.entries(filter)) {
    if (key === '$and') {
      if (!Array.isArray(expected) || !expected.every((sub) => matchesMongoFilter(sub, doc))) {
        return false;
      }
    } else if (key === '$or') {
      if (!Array.isArray(expected) || !expected.some((sub) => matchesMongoFilter(sub, doc))) {
        return false;
      }
    } else if (key === '$nor') {
      if (!Array.isArray(expected) || expected.some((sub) => matchesMongoFilter(sub, doc))) {
        return false;
      }
    } else if (key === '$expr') {
      if (!evaluateExpr(expected, doc)) {
        return false;
      }
    } else {
      const actual = doc[key];
      const hasKey = key in doc && doc[key] !== undefined;

      if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
        for (const [op, opVal] of Object.entries(expected)) {
          if (!matchFieldOperator(op, opVal, actual, hasKey)) {
            return false;
          }
        }
      } else {
        if (actual !== expected) {
          return false;
        }
      }
    }
  }

  return true;
}
