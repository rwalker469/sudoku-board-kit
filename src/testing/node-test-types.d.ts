// Minimal ambient types for the two builtin Node modules the test suite
// uses. There's no @types/node here on purpose: pulling it in just to type
// two functions would be a devDependency for a library that otherwise has
// none, and the project already treats "dependency-free" as an absolute.
declare module "node:test" {
  type TestFn = () => void | Promise<void>;
  function test(name: string, fn: TestFn): void;
  export default test;
  export { test };
}

declare module "node:assert/strict" {
  interface Strict {
    ok(value: unknown, message?: string | Error): asserts value;
    strictEqual<T>(actual: T, expected: T, message?: string | Error): void;
    deepStrictEqual(actual: unknown, expected: unknown, message?: string | Error): void;
    throws(fn: () => unknown, message?: string | Error): void;
  }
  const strict: Strict;
  export default strict;
}
