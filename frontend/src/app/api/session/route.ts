import { NextRequest, NextResponse } from "next/server";

import {
  buildParticipantIdentity,
  buildSessionRoomName,
  createParticipantToken,
  getLiveKitConfig,
  getRoomServiceClient,
  SESSION_HIDDEN_TIMEOUT_MS,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_WARNING_TIMEOUT_MS,
} from "@/lib/livekit";

export const dynamic = "force-dynamic";

type CreateSessionBody = {
  displayName?: string;
};

function normalizeDisplayName(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 48) : "Guest";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as CreateSessionBody;
    const displayName = normalizeDisplayName(body.displayName);
    const roomName = buildSessionRoomName();
    const identity = buildParticipantIdentity();
    const roomService = getRoomServiceClient();

    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 10,
      departureTimeout: 15,
      maxParticipants: 3,
      metadata: JSON.stringify({
        source: "hemanth-portfolio",
        createdAt: new Date().toISOString(),
      }),
    });

    const token = await createParticipantToken(roomName, identity, displayName);
    const { wsUrl } = getLiveKitConfig();

    return NextResponse.json(
      {
        token,
        roomName,
        identity,
        wsUrl,
        displayName,
        idleTimeoutMs: SESSION_IDLE_TIMEOUT_MS,
        warningTimeoutMs: SESSION_WARNING_TIMEOUT_MS,
        hiddenTimeoutMs: SESSION_HIDDEN_TIMEOUT_MS,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Failed to create LiveKit session", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const roomName = request.nextUrl.searchParams.get("roomName");

  if (!roomName) {
    return NextResponse.json(
      { error: 'Missing "roomName" query parameter' },
      { status: 400 }
    );
  }

  try {
    const roomService = getRoomServiceClient();
    await roomService.deleteRoom(roomName);
    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(`Failed to delete room ${roomName}`, error);
    return NextResponse.json(
      { ok: false },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
