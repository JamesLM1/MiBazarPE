import assert from "node:assert/strict";
import test from "node:test";
import { mountHcaptcha } from "../src/features/auth/hcaptcha.ts";

function fixture(width = 400) {
  const tokens = [], failures = [], removed = [];
  let callbacks;
  const api = { render: (_element, options) => { callbacks = options; return "widget-1"; }, remove: id => removed.push(id) };
  const dispose = mountHcaptcha(api, { clientWidth: width }, "public-test-key", token => tokens.push(token), reason => failures.push(reason));
  return { tokens, failures, removed, callbacks, dispose };
}

test("hCaptcha expires and closes tokens before allowing a renewed challenge", () => {
  const f = fixture();
  f.callbacks.callback("first");
  f.callbacks["expired-callback"]();
  f.callbacks.callback("renewed");
  f.callbacks["close-callback"]();
  assert.deepEqual(f.tokens, ["first", "", "renewed", ""]);
});

test("hCaptcha errors and expired challenges invalidate prior tokens", () => {
  for (const [callback, reason] of [["error-callback", "unavailable"], ["chalexpired-callback", "timeout"]]) {
    const f = fixture();
    f.callbacks.callback("previous");
    f.callbacks[callback]();
    assert.deepEqual(f.tokens, ["previous", ""]);
    assert.deepEqual(f.failures, [reason]);
  }
});

test("late hCaptcha callbacks cannot restore a token on another form", () => {
  const f = fixture();
  f.dispose();
  f.dispose();
  f.callbacks.callback("late");
  f.callbacks["error-callback"]();
  f.callbacks["expired-callback"]();
  assert.deepEqual(f.tokens, []);
  assert.deepEqual(f.failures, []);
  assert.deepEqual(f.removed, ["widget-1"]);
});

test("hCaptcha fits a narrow form and isolates SDK failures", () => {
  assert.equal(fixture(272).callbacks.size, "compact");
  assert.equal(fixture().callbacks.size, "normal");
  const failures = [];
  const dispose = mountHcaptcha({ render: () => { throw Error("load failed"); }, remove: () => assert.fail() }, { clientWidth: 400 }, "key", () => {}, reason => failures.push(reason));
  assert.deepEqual(failures, ["unavailable"]);
  assert.doesNotThrow(dispose);
});
