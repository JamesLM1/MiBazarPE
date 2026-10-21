import assert from "node:assert/strict";
import test from "node:test";
import { mountCaptcha } from "../src/features/auth/captcha.ts";

function fixture() {
  const tokens = [], failures = [], removed = [];
  let callbacks;
  const api = { render: (_element, options) => { callbacks = options; return "widget-1"; }, remove: id => removed.push(id) };
  const dispose = mountCaptcha(api, {}, "public-test-key", token => tokens.push(token), reason => failures.push(reason));
  return { tokens, failures, removed, callbacks, dispose };
}

test("captcha invalidates expired tokens and accepts a renewed challenge", () => {
  const f = fixture();
  f.callbacks.callback("first");
  f.callbacks["expired-callback"]();
  f.callbacks.callback("renewed");
  assert.deepEqual(f.tokens, ["first", "", "renewed"]);
  assert.deepEqual(f.failures, []);
});

test("provider errors, timeouts and unsupported browsers invalidate the token", () => {
  for (const [callback, reason] of [["error-callback", "unavailable"], ["timeout-callback", "timeout"], ["unsupported-callback", "unsupported"]]) {
    const f = fixture();
    f.callbacks.callback("previous");
    f.callbacks[callback]();
    assert.deepEqual(f.tokens, ["previous", ""]);
    assert.deepEqual(f.failures, [reason]);
  }
});

test("callbacks from a removed widget cannot overwrite the current form", () => {
  const f = fixture();
  f.dispose();
  f.dispose();
  f.callbacks.callback("late-token");
  f.callbacks["error-callback"]();
  f.callbacks["expired-callback"]();
  f.callbacks["timeout-callback"]();
  assert.deepEqual(f.tokens, []);
  assert.deepEqual(f.failures, []);
  assert.deepEqual(f.removed, ["widget-1"]);
});

test("render and cleanup failures do not crash the authentication page", () => {
  const tokens = [], failures = [];
  const dispose = mountCaptcha({ render: () => { throw Error("provider failure"); }, remove: () => assert.fail("no widget was rendered") }, {}, "key", value => tokens.push(value), reason => failures.push(reason));
  assert.deepEqual(tokens, [""]);
  assert.deepEqual(failures, ["unavailable"]);
  assert.doesNotThrow(dispose);
  const cleanup = mountCaptcha({ render: () => "id", remove: () => { throw Error("already removed"); } }, {}, "key", () => {}, () => {});
  assert.doesNotThrow(cleanup);
});
