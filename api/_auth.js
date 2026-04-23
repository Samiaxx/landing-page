const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");
const { listOrdersByCustomerEmail, updateOrder } = require("./_orders");

const scryptAsync = promisify(crypto.scrypt);
const fsp = fs.promises;

const SESSION_COOKIE_NAME = "primus_session";
const USER_KEY_PREFIX = "primus:user";
const SESSION_KEY_PREFIX = "primus:session";
const LOGIN_FAIL_KEY_PREFIX = "primus:auth:login-fail";
const DURABLE_URL_KEYS = ["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"];
const DURABLE_TOKEN_KEYS = ["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"];

const DEFAULT_SESSION_TTL_DAYS = Math.max(1, Number(process.env.PRIMUS_AUTH_SESSION_DAYS) || 7);
const DEFAULT_LOGIN_ATTEMPTS = Math.max(3, Number(process.env.PRIMUS_AUTH_MAX_LOGIN_ATTEMPTS) || 5);
const DEFAULT_LOGIN_LOCK_MINUTES = Math.max(1, Number(process.env.PRIMUS_AUTH_LOCK_MINUTES) || 15);

let dataRootCache = "";
let redisClientCache = null;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstEnv(keys) {
  for (const key of keys) {
    const value = text(process.env[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

function redisConfig() {
  return {
    url: firstEnv(DURABLE_URL_KEYS),
    token: firstEnv(DURABLE_TOKEN_KEYS)
  };
}

function getRedisClient() {
  const { url, token } = redisConfig();
  if (!url || !token) {
    return null;
  }

  if (!redisClientCache) {
    let Redis = null;

    try {
      ({ Redis } = require("@upstash/redis"));
    } catch (error) {
      throw new Error("Customer account storage is configured, but @upstash/redis is not installed.");
    }

    redisClientCache = new Redis({
      url,
      token,
      enableTelemetry: false
    });
  }

  return redisClientCache;
}

function resolveDataRoot() {
  if (dataRootCache) {
    return dataRootCache;
  }

  const candidates = [
    process.env.PRIMUS_DATA_DIR,
    path.join(os.tmpdir(), "primus-peptides-data"),
    path.join(__dirname, "..", ".primus-data")
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      dataRootCache = candidate;
      return dataRootCache;
    } catch {
      // Try the next writable location.
    }
  }

  throw new Error("Unable to initialize a writable data directory for Primus accounts.");
}

function authDir() {
  return path.join(resolveDataRoot(), "auth");
}

function usersDir() {
  return path.join(authDir(), "users");
}

function sessionsDir() {
  return path.join(authDir(), "sessions");
}

function loginFailuresDir() {
  return path.join(authDir(), "login-failures");
}

function ensureAuthDataRoot() {
  fs.mkdirSync(usersDir(), { recursive: true });
  fs.mkdirSync(sessionsDir(), { recursive: true });
  fs.mkdirSync(loginFailuresDir(), { recursive: true });
}

function normalizeEmail(value) {
  return text(value).toLowerCase().slice(0, 320);
}

function normalizeFullName(value) {
  return text(value).replace(/\s+/g, " ").slice(0, 120);
}

function safeId(value) {
  return text(value).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 160);
}

function safeHash(value) {
  return text(value).replace(/[^A-Fa-f0-9]/g, "").slice(0, 128);
}

function hashKey(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function userIdKey(userId) {
  return `${USER_KEY_PREFIX}:id:${safeId(userId)}`;
}

function userEmailKey(email) {
  return `${USER_KEY_PREFIX}:email:${normalizeEmail(email)}`;
}

function sessionKey(tokenHash) {
  return `${SESSION_KEY_PREFIX}:${safeHash(tokenHash)}`;
}

function loginFailKey(email) {
  return `${LOGIN_FAIL_KEY_PREFIX}:${normalizeEmail(email)}`;
}

function userFile(userId) {
  return path.join(usersDir(), `${safeId(userId)}.json`);
}

function userEmailFile(email) {
  return path.join(usersDir(), `${hashKey(normalizeEmail(email))}.email`);
}

function sessionFile(tokenHash) {
  return path.join(sessionsDir(), `${safeHash(tokenHash)}.json`);
}

function loginFailFile(email) {
  return path.join(loginFailuresDir(), `${hashKey(normalizeEmail(email))}.json`);
}

async function pathExists(filepath) {
  try {
    await fsp.access(filepath);
    return true;
  } catch {
    return false;
  }
}

function normalizeStoredValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return typeof value === "object" ? value : null;
}

function normalizeUserRecord(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  const email = normalizeEmail(user.email);
  const fullName = normalizeFullName(user.fullName);
  const passwordHash = text(user.passwordHash);

  if (!email || !fullName || !passwordHash) {
    return null;
  }

  return {
    id: safeId(user.id) || generateId("usr"),
    fullName,
    email,
    passwordHash,
    createdAt: text(user.createdAt) || new Date().toISOString(),
    updatedAt: text(user.updatedAt) || new Date().toISOString(),
    lastLoginAt: text(user.lastLoginAt)
  };
}

function normalizeSessionRecord(session) {
  if (!session || typeof session !== "object") {
    return null;
  }

  const tokenHash = safeHash(session.tokenHash);
  const userId = safeId(session.userId);

  if (!tokenHash || !userId) {
    return null;
  }

  return {
    id: safeId(session.id) || generateId("sess"),
    tokenHash,
    userId,
    createdAt: text(session.createdAt) || new Date().toISOString(),
    updatedAt: text(session.updatedAt) || new Date().toISOString(),
    expiresAt: text(session.expiresAt) || new Date(Date.now() + DEFAULT_SESSION_TTL_DAYS * 86400000).toISOString(),
    ip: text(session.ip).slice(0, 120),
    userAgent: text(session.userAgent).slice(0, 400)
  };
}

function publicUser(user) {
  return user
    ? {
      id: safeId(user.id),
      fullName: normalizeFullName(user.fullName),
      email: normalizeEmail(user.email),
      createdAt: text(user.createdAt),
      updatedAt: text(user.updatedAt),
      lastLoginAt: text(user.lastLoginAt)
    }
    : null;
}

function authError(message, statusCode, code, extra = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  Object.assign(error, extra);
  return error;
}

function validateRegistrationInput({ fullName, email, password, confirmPassword }) {
  const normalizedName = normalizeFullName(fullName);
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName || normalizedName.length < 3) {
    throw authError("Full name is required.", 400, "invalid_full_name");
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw authError("A valid email address is required.", 400, "invalid_email");
  }

  if (text(password).length < 8) {
    throw authError("Password must be at least 8 characters long.", 400, "weak_password");
  }

  if (password !== confirmPassword) {
    throw authError("Password confirmation does not match.", 400, "password_mismatch");
  }

  return {
    fullName: normalizedName,
    email: normalizedEmail,
    password: String(password || "")
  };
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const params = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
  const derived = await scryptAsync(String(password || ""), salt, 64, params);

  return [
    "scrypt",
    String(params.N),
    String(params.r),
    String(params.p),
    salt.toString("hex"),
    Buffer.from(derived).toString("hex")
  ].join("$");
}

async function verifyPassword(password, storedHash) {
  const parts = text(storedHash).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");

  if (!salt.length || !expected.length) {
    return false;
  }

  const params = {
    N: Number(parts[1]) || 16384,
    r: Number(parts[2]) || 8,
    p: Number(parts[3]) || 1,
    maxmem: 64 * 1024 * 1024
  };

  const derived = await scryptAsync(String(password || ""), salt, expected.length, params);
  const candidate = Buffer.from(derived);

  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

async function saveUserToFile(user) {
  ensureAuthDataRoot();
  const normalizedUser = normalizeUserRecord(user);
  await fsp.writeFile(userFile(normalizedUser.id), JSON.stringify(normalizedUser, null, 2));
  await fsp.writeFile(userEmailFile(normalizedUser.email), normalizedUser.id, "utf8");
  return normalizedUser;
}

async function readUserByIdFromFile(userId) {
  const file = userFile(userId);
  if (!(await pathExists(file))) {
    return null;
  }

  try {
    return normalizeUserRecord(JSON.parse(await fsp.readFile(file, "utf8")));
  } catch {
    return null;
  }
}

async function readUserByEmailFromFile(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const indexFile = userEmailFile(normalizedEmail);
  if (!(await pathExists(indexFile))) {
    return null;
  }

  try {
    const userId = safeId(await fsp.readFile(indexFile, "utf8"));
    return readUserByIdFromFile(userId);
  } catch {
    return null;
  }
}

async function saveSessionToFile(session) {
  ensureAuthDataRoot();
  const normalizedSession = normalizeSessionRecord(session);
  await fsp.writeFile(sessionFile(normalizedSession.tokenHash), JSON.stringify(normalizedSession, null, 2));
  return normalizedSession;
}

async function readSessionFromFile(tokenHash) {
  const file = sessionFile(tokenHash);
  if (!(await pathExists(file))) {
    return null;
  }

  try {
    return normalizeSessionRecord(JSON.parse(await fsp.readFile(file, "utf8")));
  } catch {
    return null;
  }
}

async function deleteSessionFromFile(tokenHash) {
  const file = sessionFile(tokenHash);
  if (!(await pathExists(file))) {
    return;
  }

  try {
    await fsp.unlink(file);
  } catch {
    // Ignore already removed files.
  }
}

async function saveLoginFailStateToFile(email, state) {
  ensureAuthDataRoot();
  await fsp.writeFile(loginFailFile(email), JSON.stringify(state, null, 2));
}

async function readLoginFailStateFromFile(email) {
  const file = loginFailFile(email);
  if (!(await pathExists(file))) {
    return null;
  }

  try {
    return normalizeStoredValue(JSON.parse(await fsp.readFile(file, "utf8")));
  } catch {
    return null;
  }
}

async function clearLoginFailStateFromFile(email) {
  const file = loginFailFile(email);
  if (!(await pathExists(file))) {
    return;
  }

  try {
    await fsp.unlink(file);
  } catch {
    // Ignore already removed files.
  }
}

async function saveUserToRedis(redis, user) {
  const normalizedUser = normalizeUserRecord(user);
  await Promise.all([
    redis.set(userIdKey(normalizedUser.id), normalizedUser),
    redis.set(userEmailKey(normalizedUser.email), normalizedUser.id)
  ]);
  return normalizedUser;
}

async function readUserByIdFromRedis(redis, userId) {
  return normalizeUserRecord(await redis.get(userIdKey(userId)));
}

async function readUserByEmailFromRedis(redis, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const userId = safeId(await redis.get(userEmailKey(normalizedEmail)));
  if (!userId) {
    return null;
  }

  return readUserByIdFromRedis(redis, userId);
}

async function saveSessionToRedis(redis, session) {
  const normalizedSession = normalizeSessionRecord(session);
  await redis.set(sessionKey(normalizedSession.tokenHash), normalizedSession);
  return normalizedSession;
}

async function readSessionFromRedis(redis, tokenHash) {
  return normalizeSessionRecord(await redis.get(sessionKey(tokenHash)));
}

async function deleteSessionFromRedis(redis, tokenHash) {
  await redis.del(sessionKey(tokenHash));
}

async function saveLoginFailStateToRedis(redis, email, state) {
  await redis.set(loginFailKey(email), state);
}

async function readLoginFailStateFromRedis(redis, email) {
  return normalizeStoredValue(await redis.get(loginFailKey(email)));
}

async function clearLoginFailStateFromRedis(redis, email) {
  await redis.del(loginFailKey(email));
}

async function saveUser(user) {
  const redis = getRedisClient();
  if (redis) {
    return saveUserToRedis(redis, user);
  }

  return saveUserToFile(user);
}

async function readUserById(userId) {
  const normalizedUserId = safeId(userId);
  if (!normalizedUserId) {
    return null;
  }

  const redis = getRedisClient();
  if (redis) {
    return readUserByIdFromRedis(redis, normalizedUserId);
  }

  return readUserByIdFromFile(normalizedUserId);
}

async function readUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const redis = getRedisClient();
  if (redis) {
    return readUserByEmailFromRedis(redis, normalizedEmail);
  }

  return readUserByEmailFromFile(normalizedEmail);
}

async function saveSession(session) {
  const redis = getRedisClient();
  if (redis) {
    return saveSessionToRedis(redis, session);
  }

  return saveSessionToFile(session);
}

async function readSessionRecord(tokenHash) {
  const normalizedHash = safeHash(tokenHash);
  if (!normalizedHash) {
    return null;
  }

  const redis = getRedisClient();
  if (redis) {
    return readSessionFromRedis(redis, normalizedHash);
  }

  return readSessionFromFile(normalizedHash);
}

async function deleteSessionRecord(tokenHash) {
  const normalizedHash = safeHash(tokenHash);
  if (!normalizedHash) {
    return;
  }

  const redis = getRedisClient();
  if (redis) {
    await deleteSessionFromRedis(redis, normalizedHash);
    return;
  }

  await deleteSessionFromFile(normalizedHash);
}

async function readLoginFailState(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const redis = getRedisClient();
  if (redis) {
    return readLoginFailStateFromRedis(redis, normalizedEmail);
  }

  return readLoginFailStateFromFile(normalizedEmail);
}

async function saveLoginFailState(email, state) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const redis = getRedisClient();
  if (redis) {
    await saveLoginFailStateToRedis(redis, normalizedEmail, state);
    return;
  }

  await saveLoginFailStateToFile(normalizedEmail, state);
}

async function clearLoginFailState(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const redis = getRedisClient();
  if (redis) {
    await clearLoginFailStateFromRedis(redis, normalizedEmail);
    return;
  }

  await clearLoginFailStateFromFile(normalizedEmail);
}

function nextFailedLoginState(currentState) {
  const now = Date.now();
  const current = currentState && typeof currentState === "object"
    ? currentState
    : {};
  const lastFailureTime = Date.parse(text(current.lastFailureAt) || 0);
  const withinWindow = Number.isFinite(lastFailureTime) && (now - lastFailureTime) < DEFAULT_LOGIN_LOCK_MINUTES * 60000;
  const count = withinWindow ? Number(current.count || 0) + 1 : 1;
  const lockedUntil = count >= DEFAULT_LOGIN_ATTEMPTS
    ? new Date(now + DEFAULT_LOGIN_LOCK_MINUTES * 60000).toISOString()
    : "";

  return {
    count,
    lastFailureAt: new Date(now).toISOString(),
    lockedUntil
  };
}

function loginIsLocked(state) {
  const lockedUntil = Date.parse(text(state && state.lockedUntil));
  return Number.isFinite(lockedUntil) && lockedUntil > Date.now();
}

function parseCookies(headerValue) {
  const cookies = {};
  text(headerValue)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index <= 0) {
        return;
      }

      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      cookies[key] = decodeURIComponent(value);
    });

  return cookies;
}

function isSecureRequest(req) {
  const forwardedProto = text(req && req.headers && (req.headers["x-forwarded-proto"] || req.headers["X-Forwarded-Proto"])).toLowerCase();
  const forwardedSsl = text(req && req.headers && (req.headers["x-forwarded-ssl"] || req.headers["X-Forwarded-Ssl"])).toLowerCase();
  const vercelEnv = text(process.env.VERCEL_ENV).toLowerCase();

  return forwardedProto === "https" || forwardedSsl === "on" || vercelEnv === "production" || vercelEnv === "preview";
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  parts.push(`SameSite=${options.sameSite || "Lax"}`);
  parts.push(`Path=${options.path || "/"}`);

  if (options.expires instanceof Date) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  return parts.join("; ");
}

function sessionTokenFromRequest(req) {
  const cookies = parseCookies(req && req.headers && req.headers.cookie);
  return text(cookies[SESSION_COOKIE_NAME]);
}

function setSessionCookie(req, res, token, expiresAt) {
  const expires = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));

  res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "Lax",
    path: "/",
    maxAge,
    expires
  }));
}

function clearSessionCookie(req, res) {
  res.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0)
  }));
}

async function createUserAccount({ fullName, email, password, confirmPassword }) {
  const input = validateRegistrationInput({ fullName, email, password, confirmPassword });
  const existingUser = await readUserByEmail(input.email);

  if (existingUser) {
    throw authError("An account with this email already exists.", 409, "email_exists");
  }

  const now = new Date().toISOString();
  const user = await saveUser({
    id: generateId("usr"),
    fullName: input.fullName,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  });

  await clearLoginFailState(user.email);
  return user;
}

async function authenticateUserAccount({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !text(password)) {
    throw authError("Email and password are required.", 400, "missing_credentials");
  }

  const loginState = await readLoginFailState(normalizedEmail);
  if (loginIsLocked(loginState)) {
    throw authError("Too many failed login attempts. Please try again later.", 429, "login_locked", {
      lockedUntil: text(loginState.lockedUntil)
    });
  }

  const user = await readUserByEmail(normalizedEmail);
  const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    const nextState = nextFailedLoginState(loginState);
    await saveLoginFailState(normalizedEmail, nextState);

    if (loginIsLocked(nextState)) {
      throw authError("Too many failed login attempts. Please try again later.", 429, "login_locked", {
        lockedUntil: text(nextState.lockedUntil)
      });
    }

    throw authError("Invalid email or password.", 401, "invalid_credentials");
  }

  await clearLoginFailState(normalizedEmail);

  const updatedUser = await saveUser({
    ...user,
    lastLoginAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return updatedUser;
}

async function startUserSession(req, res, user) {
  const token = randomToken();
  const tokenHash = hashKey(token);
  const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL_DAYS * 86400000);

  await saveSession({
    id: generateId("sess"),
    tokenHash,
    userId: safeId(user.id),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    ip: text(req && req.headers && (req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"] || "")).split(",")[0],
    userAgent: text(req && req.headers && (req.headers["user-agent"] || req.headers["User-Agent"]))
  });

  setSessionCookie(req, res, token, expiresAt);
  return {
    expiresAt: expiresAt.toISOString()
  };
}

async function clearUserSession(req, res) {
  const token = sessionTokenFromRequest(req);
  if (token) {
    await deleteSessionRecord(hashKey(token));
  }

  clearSessionCookie(req, res);
}

async function getAuthenticatedSession(req) {
  const token = sessionTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const session = await readSessionRecord(hashKey(token));
  if (!session) {
    return null;
  }

  const expiresAt = Date.parse(text(session.expiresAt));
  if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
    await deleteSessionRecord(session.tokenHash);
    return null;
  }

  const user = await readUserById(session.userId);
  if (!user) {
    await deleteSessionRecord(session.tokenHash);
    return null;
  }

  return {
    session,
    user,
    publicUser: publicUser(user)
  };
}

async function claimOrdersForUser(user, limit = 50) {
  if (!user || !normalizeEmail(user.email)) {
    return { linked: 0 };
  }

  const orders = await listOrdersByCustomerEmail(user.email, limit);
  let linked = 0;

  for (const order of orders) {
    if (!order || !text(order.reference)) {
      continue;
    }

    if (safeId(order.accountUserId) === safeId(user.id)) {
      continue;
    }

    const updated = await updateOrder(order.reference, (current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        accountUserId: safeId(user.id),
        accountEmail: normalizeEmail(user.email)
      };
    });

    if (updated) {
      linked += 1;
    }
  }

  return { linked };
}

module.exports = {
  authError,
  claimOrdersForUser,
  clearUserSession,
  createUserAccount,
  getAuthenticatedSession,
  publicUser,
  readUserByEmail,
  startUserSession,
  text,
  authenticateUserAccount
};
