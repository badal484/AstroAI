// Manual Jest mock for socket.io-client (auto-applied — see
// https://jestjs.io/docs/manual-mocks#mocking-node-modules). Provides a
// minimal fake socket (on/off/emit + a `.io` manager stub for
// reconnect_attempt-style events) so screens/hooks that connect a chat
// socket can render and be exercised under Jest without a real network
// connection. Tests that need to simulate server-pushed events can pull
// the most recently created fake socket via `io.__getLastSocket()` and
// call `.__trigger(event, payload)` on it directly.
function createFakeSocket() {
  const listeners = new Map();
  const managerListeners = new Map();

  const socket = {
    connected: false,
    connect: jest.fn(() => {
      socket.connected = true;
    }),
    disconnect: jest.fn(() => {
      socket.connected = false;
    }),
    on: jest.fn((event, handler) => {
      const set = listeners.get(event) ?? new Set();
      set.add(handler);
      listeners.set(event, set);
    }),
    off: jest.fn((event, handler) => {
      listeners.get(event)?.delete(handler);
    }),
    emit: jest.fn(),
    io: {
      on: jest.fn((event, handler) => {
        const set = managerListeners.get(event) ?? new Set();
        set.add(handler);
        managerListeners.set(event, set);
      }),
      off: jest.fn((event, handler) => {
        managerListeners.get(event)?.delete(handler);
      }),
    },
    __trigger(event, payload) {
      for (const handler of listeners.get(event) ?? []) handler(payload);
    },
    __triggerManager(event, payload) {
      for (const handler of managerListeners.get(event) ?? []) handler(payload);
    },
  };
  return socket;
}

let lastSocket = null;

function io() {
  lastSocket = createFakeSocket();
  return lastSocket;
}
io.__getLastSocket = () => lastSocket;

module.exports = { io };
