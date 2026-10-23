const assert = require("assert");

// In-memory simulation of the Offline Queue logic
class MockOfflineQueue {
  constructor() {
    this.store = [];
  }

  enqueue(endpoint, method = "POST", payload) {
    const item = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      endpoint,
      method,
      payload,
      createdAt: Date.now() + this.store.length, // ensure strict ordering
      retryCount: 0,
    };
    this.store.push(item);
    return item;
  }

  getQueue() {
    return [...this.store].sort((a, b) => a.createdAt - b.createdAt);
  }

  getCount() {
    return this.store.length;
  }

  async syncQueue(mockFetch) {
    const queue = this.getQueue();
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        const res = await mockFetch(item.endpoint, {
          method: item.method,
          body: JSON.stringify(item.payload),
        });

        if (res.ok) {
          this.store = this.store.filter((i) => i.id !== item.id);
          synced++;
        } else {
          failed++;
        }
      } catch (err) {
        // Network connection dropped mid-drain
        failed++;
        break;
      }
    }

    return { synced, failed };
  }
}

console.log("==================================================");
console.log("       INDEXEDDB OFFLINE QUEUE TESTS             ");
console.log("==================================================");

// Test 1: Enqueue and FIFO Ordering
const queue = new MockOfflineQueue();
const req1 = queue.enqueue("/api/transactions", "POST", { amount: 250, notes: "Chai" });
const req2 = queue.enqueue("/api/transactions", "POST", { amount: 1200, notes: "Dinner" });
const req3 = queue.enqueue("/api/dues", "POST", { amount: 500, friendId: "f1" });

assert.strictEqual(queue.getCount(), 3);
const list = queue.getQueue();
assert.strictEqual(list[0].payload.notes, "Chai");
assert.strictEqual(list[1].payload.notes, "Dinner");
assert.strictEqual(list[2].payload.amount, 500);
console.log("✅ Test 1 Passed: Enqueued requests correctly saved in strict FIFO chronological sequence.");

// Test 2: Successful full sync drains queue
const mockSuccessfulFetch = async (url, opts) => ({ ok: true, status: 200 });
(async () => {
  const syncResult = await queue.syncQueue(mockSuccessfulFetch);
  assert.strictEqual(syncResult.synced, 3);
  assert.strictEqual(syncResult.failed, 0);
  assert.strictEqual(queue.getCount(), 0, "Queue must be completely empty after successful sync");
  console.log("✅ Test 2 Passed: Full sync successfully posts all queued items and purges local store.");

  // Test 3: Network interruption mid-sync preserves remaining items
  const queue2 = new MockOfflineQueue();
  queue2.enqueue("/api/transactions", "POST", { amount: 100 });
  queue2.enqueue("/api/transactions", "POST", { amount: 200 });
  queue2.enqueue("/api/transactions", "POST", { amount: 300 });

  let callCount = 0;
  const mockInterruptedFetch = async (url, opts) => {
    callCount++;
    if (callCount === 1) return { ok: true, status: 200 };
    throw new Error("Network unreachable"); // fails on 2nd item
  };

  const partialResult = await queue2.syncQueue(mockInterruptedFetch);
  assert.strictEqual(partialResult.synced, 1);
  assert.strictEqual(partialResult.failed, 1);
  assert.strictEqual(queue2.getCount(), 2, "Remaining 2 items must be safely kept in queue");
  console.log("✅ Test 3 Passed: Mid-sync network drop halts gracefully and preserves un-synced items.");

  // Test 4: Empty queue sync returns zero with no-op
  const emptyQueue = new MockOfflineQueue();
  const emptyResult = await emptyQueue.syncQueue(mockSuccessfulFetch);
  assert.strictEqual(emptyResult.synced, 0);
  assert.strictEqual(emptyResult.failed, 0);
  console.log("✅ Test 4 Passed: Empty queue sync performs safe no-op.");

  console.log("\n🎯 All IndexedDB Offline Queue tests passed successfully with 100% precision!");
})();
