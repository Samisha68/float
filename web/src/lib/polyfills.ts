import { Buffer } from "buffer";

// Wallet libraries use Buffer internally; business UI does not load this chunk.
globalThis.Buffer ??= Buffer;
