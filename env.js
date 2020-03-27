/**
 * @param {string} envVarName
 * @param {number} defaultValue
 * @returns {number}
 */
function parseNumberFromOptionalEnvVar(envVarName, defaultValue) {
  const envVarValue = process.env[envVarName];
  if (envVarValue == null || envVarValue === '') {
    return defaultValue;
  }
  const asNumber = Number(envVarValue);
  if (Number.isNaN(asNumber)) {
    throw new Error(`Env var "${envVarName}" should be a number or blank. It is not. Value: "${envVarValue}"`);
  }
  return asNumber;
}

const FEED_SESSIONSERIES_PAGE_SIZE = parseNumberFromOptionalEnvVar('FEED_SESSIONSERIES_PAGE_SIZE', 60);
const FEED_SESSIONSERIES_TIMESTAMP_INVERVAL_MINUTES = parseNumberFromOptionalEnvVar('FEED_SESSIONSERIES_TIMESTAMP_INVERVAL_MINUTES', 5);
const SCHEDULE_MAX_END_DAY_OFFSET = parseNumberFromOptionalEnvVar('SCHEDULE_MAX_END_DAY_OFFSET', 28);
const SCHEDULE_MIN_END_DAY_OFFSET = parseNumberFromOptionalEnvVar('SCHEDULE_MIN_END_DAY_OFFSET', 14);
const SCHEDULE_START_DAY_OFFSET = parseNumberFromOptionalEnvVar('SCHEDULE_START_DAY_OFFSET', -7);
const TIMESTAMP_START_DAY_OFFSET = parseNumberFromOptionalEnvVar('TIMESTAMP_START_DAY_OFFSET', -14);

module.exports = {
  FEED_SESSIONSERIES_PAGE_SIZE,
  FEED_SESSIONSERIES_TIMESTAMP_INVERVAL_MINUTES,
  SCHEDULE_MAX_END_DAY_OFFSET,
  SCHEDULE_MIN_END_DAY_OFFSET,
  SCHEDULE_START_DAY_OFFSET,
  TIMESTAMP_START_DAY_OFFSET,
};
