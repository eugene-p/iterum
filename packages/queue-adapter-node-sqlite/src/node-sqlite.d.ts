declare module "node:sqlite" {
  export type SqliteStatement = {
    all: (...params: unknown[]) => unknown[];
    run: (...params: unknown[]) => unknown;
  };

  export class DatabaseSync {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): SqliteStatement;
    close(): void;
  }
}
