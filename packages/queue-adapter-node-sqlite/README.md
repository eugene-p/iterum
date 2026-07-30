# @qkitt/queue-adapter-node-sqlite

Node.js filesystem-backed SQLite `RowStore` for `@qkitt/queue`.

It uses `node:sqlite`, requires Node 22.5 or newer, and is intended for one
Node process to own a queue database. It is not a browser or React Native
adapter; those runtimes should supply their own platform storage adapter.

`@qkitt/queue` is a peer dependency so this package can move into the qkitt
queue monorepo or be published independently without bundling the queue core.

```ts
import { buildQueue } from "@qkitt/queue";
import { createNodeSqliteRowStore } from "@qkitt/queue-adapter-node-sqlite";

const store = createNodeSqliteRowStore<{ id: number }>({
  filename: "./jobs.sqlite",
  tableName: "email_jobs",
});
const queue = buildQueue({ store });
await queue.hydrate();
```
