import { useEffect, useRef, useState } from "react";
import {
  generateRoomCode,
  isRemoteConfigured,
  openRemoteRoom,
  type RemoteCommand,
  type RemoteError,
  type RemoteRoom,
  type RemoteState,
  type RoomMember,
} from "@/lib/remote-control";

const HOST_ROOM_STORAGE_KEY = "qp_host_room_code";

function getStoredOrNewRoomCode(): string {
  try {
    const existing = sessionStorage.getItem(HOST_ROOM_STORAGE_KEY);
    if (existing && existing.length >= 4) return existing;
    const fresh = generateRoomCode();
    sessionStorage.setItem(HOST_ROOM_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return generateRoomCode();
  }
}

/**
 * Host side of the phone-remote relay. Initializes the room connection on mount,
 * broadcasts the latest timer state every 2s and on every change, and dispatches
 * incoming commands to `onCommand`. The `panelOpen` state controls only the
 * QR modal visibility on screen without killing the underlying socket relay.
 */
export function useRemoteHost({
  getSnapshot,
  onCommand,
}: {
  getSnapshot: () => RemoteState;
  onCommand: (cmd: RemoteCommand) => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [roomCode] = useState<string>(() => getStoredOrNewRoomCode());
  const [status, setStatus] = useState("connecting");
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [room, setRoom] = useState<RemoteRoom | null>(null);
  const [error, setError] = useState<RemoteError | null>(null);

  const snapshotRef = useRef(getSnapshot);
  snapshotRef.current = getSnapshot;
  const commandRef = useRef(onCommand);
  commandRef.current = onCommand;
  const roomRef = useRef<RemoteRoom | null>(null);

  // Initialize and maintain host room relay for the lifetime of this component
  useEffect(() => {
    if (!isRemoteConfigured()) {
      setStatus("not-configured");
      return;
    }
    let cancelled = false;
    let opened: RemoteRoom | null = null;

    setStatus("connecting");
    setError(null);
    openRemoteRoom(roomCode, "host", {
      onCommand: (cmd) => {
        if (cmd.type === "cmd" && cmd.action === "requestState") {
          const currentRoom = opened || roomRef.current;
          if (currentRoom) currentRoom.publish(snapshotRef.current());
          return;
        }
        commandRef.current(cmd);
      },
      onMembers: (m) => {
        setMembers(m);
        const currentRoom = opened || roomRef.current;
        if (currentRoom) currentRoom.publish(snapshotRef.current());
      },
      onConnectionState: setStatus,
      onError: setError,
    }).then((r) => {
      if (cancelled) {
        r?.close();
        return;
      }
      opened = r;
      roomRef.current = r;
      setRoom(r);
      if (!r) setStatus("not-configured");
    });

    return () => {
      cancelled = true;
      opened?.close();
      roomRef.current = null;
      setRoom(null);
      setMembers([]);
    };
  }, [roomCode]);

  // Broadcast a fresh snapshot immediately and every 2s while connected
  useEffect(() => {
    if (!room) return;
    const publishNow = () => room.publish(snapshotRef.current());
    publishNow();
    const id = window.setInterval(publishNow, 2000);
    return () => window.clearInterval(id);
  }, [room]);

  // Also push immediately whenever the snapshot value changes
  const prevJson = useRef<string | null>(null);
  useEffect(() => {
    if (!room) return;
    const json = JSON.stringify(snapshotRef.current());
    if (json !== prevJson.current) {
      prevJson.current = json;
      room.publish(JSON.parse(json) as RemoteState);
    }
  });

  // Reconnect stuck host connection
  const stuckSince = useRef<number | null>(null);
  useEffect(() => {
    if (status === "connected" || status === "connecting" || status === "not-configured") {
      stuckSince.current = null;
      return;
    }
    if (status === "failed") return;
    const now = Date.now();
    if (stuckSince.current === null) stuckSince.current = now;
    if (now - stuckSince.current > 5000) {
      stuckSince.current = now;
      room?.reconnect();
    }
  }, [status, room]);

  return { panelOpen, setPanelOpen, roomCode, status, members, error };
}
