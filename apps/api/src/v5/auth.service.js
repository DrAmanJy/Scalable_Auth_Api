import crypto from 'crypto';

class RefreshTokenStorage {
  constructor() {
    this.storage = new Map();
    this.userTokenIndex = new Map();
  }

  store(userId, token, deviceId) {
    const stringUserId = this.#convertUserIdToString(userId);
    const hashToken = this.#hashRefreshToken(token);

    const now = Date.now();

    const tokenData = {
      userId: stringUserId,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      isUsed: false,
      usedAt: null,
      deviceId,
      createdAt: now,
    };

    if (!this.userTokenIndex.has(stringUserId)) {
      this.userTokenIndex.set(stringUserId, new Set());
    }

    this.userTokenIndex.get(stringUserId).add(hashToken);
    this.storage.set(hashToken, tokenData);
  }

  findByToken(token) {
    const hashToken = this.#hashRefreshToken(token);
    return this.storage.get(hashToken) || null;
  }

  markUsed(token) {
    const hashToken = this.#hashRefreshToken(token);
    const tokenData = this.storage.get(hashToken);

    if (!tokenData) return false;
    if (tokenData.expiresAt < Date.now()) return false;
    if (tokenData.isUsed) return false;

    tokenData.isUsed = true;
    tokenData.usedAt = Date.now();

    return true;
  }

  #convertUserIdToString(userId) {
    return userId.toString();
  }

  #hashRefreshToken(token) {
    return crypto.createHash('sha256').update(token, 'utf8').digest('base64');
  }
}

const refreshTokenStorage = new RefreshTokenStorage();
export default refreshTokenStorage;

// {
//     deviceId,
//     userAgent,
//     ip,
//     createdAt,
//     lastUsedAt
// }
