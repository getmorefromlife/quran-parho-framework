import { useEffect, useRef, useState } from "react";
import {
  generateRoomCode,
  isRemoteConfigured,
  openRemoteRoom,
  type RemoteCommand,
  type RemoteRoom,
  type RemoteState,
  type RoomMember,
} from "@/lib/remote-control";

/**
 * Host side of the phone-remote relay. Opens the room while `panelOpen` is
 * true, broadcasts the latest timer state every 2s and on every change, and
 * dispatches incoming commands to `onCommand`. The host machine stays the
 * single source of truth for countdowns.
 */
export function useRemoteHost({
  getSnapshot,
  onCommand,
}: {
  getSnapshot: () => RemoteState;
  onCommand: (cmd: RemoteCommand) => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [status, setStatus] = useState("connecting");
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [room, setRoom] = useState<RemoteRoom | null>(null);

  const snapshotRef = useRef(getSnapshot);
  snapshotRef.current = getSnapshot;
  const commandRef = useRef(onCommand);
  commandRef.current = onCommand;

  useEffect(() => {
    if (!panelOpen) return;
    if (!isRemoteConfigured()) {
      setStatus("not-configured");
      return;
    }
    let cancelled = false;
    let opened: RemoteRoom | null = null;
    const code = generateRoomCode();
    setRoomCode(code);
    openRemoteRoom(code, "host", {
      onCommand: (cmd) => commandRef.current(cmd),
      onMembers: setMembers,
      onConnectionState: setStatus,
    }).then((r) => {
      if (cancelled) {
        r?.close();
        return;
      }
      opened = r;
      setRoom(r);
      if (!r) setStatus("not-configured");
    });
    return () => {
      cancelled = true;
      opened?.close();
      setRoom(null);
      setMembers([]);
    };
  }, [panelOpen]);

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

  return { panelOpen, setPanelOpen, roomCode, status, members };
}
