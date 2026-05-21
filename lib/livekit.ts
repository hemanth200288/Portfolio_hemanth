import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

export const SESSION_IDLE_TIMEOUT_MS = 3 * 60 * 1000;
export const SESSION_WARNING_TIMEOUT_MS = 20 * 1000;
export const SESSION_HIDDEN_TIMEOUT_MS = 45 * 1000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getLiveKitConfig() {
  return {
    apiKey: requireEnv("LIVEKIT_API_KEY"),
    apiSecret: requireEnv("LIVEKIT_API_SECRET"),
    wsUrl: requireEnv("LIVEKIT_URL"),
  };
}

export function getRoomServiceClient() {
  const { wsUrl, apiKey, apiSecret } = getLiveKitConfig();
  return new RoomServiceClient(wsUrl, apiKey, apiSecret);
}

export function createParticipantToken(roomName: string, identity: string, name: string) {
  const { apiKey, apiSecret } = getLiveKitConfig();
  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: "10m",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
}

export function buildSessionRoomName() {
  return `hemanth-${crypto.randomUUID().slice(0, 8)}`;
}

export function buildParticipantIdentity() {
  return `guest-${crypto.randomUUID().slice(0, 8)}`;
}
