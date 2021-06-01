import {
    equal as daEqual,
} from 'https://deno.land/std@0.97.0/testing/asserts.ts';

type Int = number;

/** Shrink a boolean value. False is considered smaller than true. */
export function shrinkBool(x: boolean): boolean[] {
    if (x === true) {
        return [false];
    }
    return [];
}

/** See https://hackage.haskell.org/package/QuickCheck-2.14.2/docs/src/Test.QuickCheck.Arbitrary.html#shrinkIntegral */
export function shrinkInt(x: Int): Int[] {
    const res = [];
    if (x < 0) {
        res.push(-x);
    }
    if (x !== 0) {
        res.push(0);
    }
    let i = x < 0 ? Math.ceil(x / 2) : Math.floor(x / 2);
    let elt = x - i;
    while (true) {
        if (!(Math.abs(elt) < Math.abs(x))) {
            return unique(res);
        }
        res.push(elt);
        i = i < 0 ? Math.ceil(i / 2) : Math.floor(i / 2);
        elt = x - i;
    }
}

function splitAt<T>(xs: T[], n: number): [T[], T[]] {
    return [xs.slice(0, n), xs.slice(n)];
}

function deeplyEqual<T>(x: T, y: T): boolean {
    return daEqual(x, y);
}

function unique<T>(xs: T[]): T[] {
    const res: T[] = [];
    const seen = (x: T) => {
        return res.findIndex(y => deeplyEqual(x, y)) !== -1;
    }
    for (let i = 0; i < xs.length; i++) {
        if (!seen(xs[i])) {
            res.push(xs[i]);
        }
    }
    return res;
}

/** Return a new array with the element at the given index replaced with the given element. */
function replace<T>(xs: T[], i: number, elt: T): T[] {
    return xs.slice(0, i - xs.length).concat(elt, xs.slice(i + 1));
}

/**
 *
 * Shrink a list. `shr` is used to shrink each element.
 *
 * This uses a similar algorithm to the one seen in
 * https://hackage.haskell.org/package/QuickCheck-2.14.2/docs/src/Test.QuickCheck.Arbitrary.html#shrinkList,
 * but removes duplicate results.
 *
 */
export function shrinkList<T>(shr: (x: T) => T[], xs: T[]) {
    const n = xs.length

    const twoDivisors = (n: number): number[] => {
        const res = [];
        n = Math.floor(n);
        while (n > 0) {
            res.push(n);
            n = Math.floor(n / 2);
        }
        return res;
    }

    const removes = (k: number, n: number, xs: T[]): T[][] => {
        const [xs1, xs2] = splitAt(xs, k);
        if (k > n) {
            return [];
        }
        if (xs2.length === 0) {
            return [[]];
        }
        return [xs2, ...removes(k, (n - k), xs2).map(ys => xs1.concat(ys))];
    };
    const shrunkOne: T[][] = [];
    for (let i = 0; i < xs.length; i++) {
        shr(xs[i]).forEach(e => shrunkOne.push(replace(xs, i, e)));
    }
    return unique(twoDivisors(n).map(e => removes(e, n, xs)).flat().concat(shrunkOne));
}
