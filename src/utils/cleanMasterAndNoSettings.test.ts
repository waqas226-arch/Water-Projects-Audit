import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { getCloudSyncEndpoint, fetchCloudData, getLastSyncTime } from './cloudSync.ts';
import { getUsers, ensureDemoDataCleared } from './storage.ts';

describe('Clean Master DB & No Confusing Settings or External Relays', () => {
  before(() => {
    if (typeof (globalThis as any).localStorage === 'undefined') {
      const store: Record<string, string> = {};
      (globalThis as any).localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = String(v); },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); }
      };
    }
  });

  it('does not point to third-party api.restful-api.dev relay by default', () => {
    const endpoint = getCloudSyncEndpoint();
    assert.strictEqual(endpoint.includes('api.restful-api.dev'), false, 'Should never point to api.restful-api.dev');
  });

  it('wipes any stale custom endpoint or token from storage on load', () => {
    localStorage.setItem('fgrf_cloud_sync_custom_endpoint', 'https://stale-relay.example.com');
    localStorage.setItem('fgrf_cloud_sync_github_token', 'stale_token_123');

    ensureDemoDataCleared();

    assert.strictEqual(localStorage.getItem('fgrf_cloud_sync_custom_endpoint'), null);
    assert.strictEqual(localStorage.getItem('fgrf_cloud_sync_github_token'), null);
  });

  it('users registry strictly maintains only Syed Waqas accounts and no demo users', () => {
    const users = getUsers();
    assert.strictEqual(users.length, 2, 'Must have strictly 2 official accounts');
    const userIds = users.map((u) => u.id.toUpperCase());
    assert.ok(userIds.includes('FGRF-MIS-01'));
    assert.ok(userIds.includes('42101-1234567-1'));
    assert.ok(!userIds.includes('FGRF-AUD-001'));
    assert.ok(!userIds.includes('FGRF-INSP-01'));
  });
});

