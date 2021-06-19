import { da } from './deps.ts';

export import AssertionError = da.AssertionError;

type Assertion = void;

/** Assert that the expression is true. */
export function assert(expr: boolean, msg = ""): Assertion {
    return da.assert(expr, msg);
}

/** Assert that the two expressions are deeply equal. */
export function assertEquals<T>(actual: T, expected: T, msg?: string): Assertion {
    return da.assertEquals(actual, expected, msg);
}

/** Assert that the two expressions are not deeply equal. */
export function assertNotEquals<T>(actual: T, expected: T, msg?: string): Assertion {
    return da.assertNotEquals(actual, expected, msg);
}

/** Assert that the two expressions are strictly equal. */
export function assertStrictEquals<T>(actual: T, expected: T, msg?: string): Assertion {
    return da.assertStrictEquals(actual, expected, msg);
}

/** Assert that the expression is not `null` or `undefined` */
export function assertExists<T>(actual: T, msg?: string): Assertion {
    return da.assertExists(actual, msg);
}

/** Assert that the second string is included in the first. */
export function assertStringIncludes(actual: string, expected: string, msg?: string): Assertion {
    return da.assertStringIncludes(actual, expected, msg);
}

/** Assert that the second array is a sub-array of the first. */
export function assertArrayIncludes<T>(actual: T[], expected: T[], msg?: string): Assertion {
    return da.assertArrayIncludes(actual, expected, msg);
}

/** Assert that the string matches the given regular expression. */
export function assertMatch(actual: string, expected: RegExp, msg?: string): Assertion {
    return da.assertMatch(actual, expected, msg);
}

/** Assert that the string does not match the given regular expression. */
export function assertNotMatch(actual: string, expected: RegExp, msg?: string): Assertion {
    return da.assertNotMatch(actual, expected, msg);
}

/** Assert that the second object is (deeply) a sub-object of the first object. */
export function assertObjectMatch(actual: Record<PropertyKey, unknown>, expected: Record<PropertyKey, unknown>): Assertion {
    return da.assertObjectMatch(actual, expected);
}

/** Assert that the function throws an error of the given type (or `Error`). If `msgIncludes` is provided, check that the error messages includes the string. */
export function assertThrows(fn: () => void, errClass?: { new(...args: any[]): Error }, msgIncludes = "", msg?: string): Error {
    return da.assertThrows(fn, errClass, msgIncludes, msg);
}

/** Assert that the function throws an error of the given type (or `Error`) or rejects. If `msgIncludes` is provided, check that the error messages includes the string. */
export function assertThrowsAsync(fn: () => Promise<void>, errClass?: { new(...args: any[]): Error }, msgIncludes = "", msg?: string): Promise<Error> {
    return da.assertThrowsAsync(fn, errClass, msgIncludes, msg);
}
