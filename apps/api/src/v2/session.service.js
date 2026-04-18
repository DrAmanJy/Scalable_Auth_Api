import crypto from 'crypto';

function createSessionService() {
  const sessions = new Map();

  return {
    createSession: function (userId) {
      let sessionId;
      try {
        sessionId = crypto.randomBytes(16).toString('hex');
      } catch (err) {
        throw new Error('Failed to create random session id', { cause: err });
      }
      const createdAt = Date.now();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

      sessions.set(sessionId, { userId, createdAt, expiresAt });
      return sessionId;
    },

    getSession: function (sessionId) {
      const session = sessions.get(sessionId);
      if (session && session.expiresAt < Date.now()) {
        sessions.delete(sessionId);
        return null;
      }
      return session ? session : null;
    },

    deleteSession: function (sessionId) {
      return sessions.delete(sessionId);
    },
  };
}

const sessionService = createSessionService();
export default sessionService;
