/**
 * Returns true only for non-null, non-array objects.
 * @param {*} value Candidate value.
 * @returns {boolean} Whether the value can be recursively merged.
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Recursively merges configuration objects without mutating either input.
 * Arrays and primitive values in the override replace their base values.
 * @param {object} base Default values.
 * @param {object} override Environment-specific values.
 * @returns {object} New merged object.
 */
function deepMerge(base, override) {
  const result = { ...base };

  for (const [key, value] of Object.entries(override || {})) {
    result[key] = isPlainObject(value) && isPlainObject(result[key])
      ? deepMerge(result[key], value)
      : value;
  }

  return result;
}

/**
 * Resolves a required value using a dot-delimited key path.
 * @param {object} source Object containing test data.
 * @param {string} keyPath Path such as sites.exampleCom.heading.
 * @returns {*} Resolved value.
 * @throws {Error} When any segment is missing.
 */
function getRequiredValue(source, keyPath) {
  const segments = keyPath.split('.');
  let value = source;

  for (const segment of segments) {
    if (value === null || value === undefined || !(segment in Object(value))) {
      throw new Error(`Required data key '${keyPath}' was not found.`);
    }
    value = value[segment];
  }

  return value;
}

module.exports = { deepMerge, getRequiredValue, isPlainObject };
