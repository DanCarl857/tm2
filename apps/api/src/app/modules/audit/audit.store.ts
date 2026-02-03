import { AuditLogEntry } from '@ckouetchua-87342/data';

export class AuditStore {
  private logs: AuditLogEntry[] = [];

  add(entry: AuditLogEntry) {
    this.logs.unshift(entry);
  }

  list() {
    return this.logs;
  }
}
