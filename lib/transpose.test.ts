// run: npx tsx lib/transpose.test.ts
import assert from "node:assert/strict";
import { transposeKey as t } from "./transpose";

assert.equal(t("G+2"), "A");
assert.equal(t("Em-5"), "Bm");
assert.equal(t("Bb+1"), "B");
assert.equal(t("Eb-3"), "C");
assert.equal(t("Am+4"), "C#m");
assert.equal(t("C#m"), "C#m");
assert.equal(t(""), "");
assert.equal(t("nonsense"), "nonsense");
console.log("transpose ok");
