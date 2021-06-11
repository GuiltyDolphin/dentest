import {
    types
} from './deps.ts';

import Constructor = types.Constructor;
import KeysOfType = types.KeysOfType;

type Meta = {
    skip: boolean,
    isAfter: boolean,
    isBefore: boolean,
    isSubtest: boolean,
    isTest: boolean,
}

function defaultMeta(): Meta {
    return {
        skip: false,
        isAfter: false,
        isBefore: false,
        isSubtest: false,
        isTest: false,
    };
}

type Decorator<T> = (target: any, propertyKey: string) => T;

type DecoratorAction = Decorator<void>;

const meta = Symbol('meta');

function getMetaOrDefault(target: object): Meta {
    return Reflect.get(target, meta) ?? defaultMeta();
}

/** Get the meta property `prop` from `target`, or from the default meta properties if it isn't set. */
function getMetaProp<K extends keyof Meta>(target: object, prop: K): Meta[K] {
    return getMetaOrDefault(target)[prop];
}

function setMetaProp(target: object, metaKey: keyof Meta, value: Meta[typeof metaKey]) {
    const existing = getMetaOrDefault(target);
    Reflect.set(target, meta, { ...existing, [metaKey]: value });
}

/** Decorator to enable the boolean meta property `metaKey` on a target. */
function metaEnabler(metaKey: KeysOfType<Meta, boolean>): DecoratorAction {
    return metaSetter(metaKey, true);
}

/** Decorator to set the meta property `metaKey` to `value` on a target. */
function metaSetter(metaKey: keyof Meta, value: Meta[typeof metaKey]): DecoratorAction {
    return (target, propertyKey) => setMetaProp(target[propertyKey], metaKey, value);
}

/** Retrieve the value of the meta property `metaKey` from a target. */
function metaGetter<T>(metaKey: KeysOfType<Meta, T>): (x: object) => Meta[KeysOfType<Meta, T>] {
    return (x: any) => getMetaProp(x, metaKey);
}

/** Retrieve the value of the boolean meta property `metaKey` from a target. */
function metaGetterBoolean(metaKey: KeysOfType<Meta, boolean>): (x: object) => boolean {
    return metaGetter(metaKey);
}

export const after = metaEnabler('isAfter');
export const before = metaEnabler('isBefore');
export const skip = metaEnabler('skip');
export const subtest = metaEnabler('isSubtest');
export const test = metaEnabler('isTest');

const shouldSkip = metaGetterBoolean('skip');
const isTest = metaGetterBoolean('isTest');
const isAfter = metaGetterBoolean('isAfter');
const isBefore = metaGetterBoolean('isBefore');
const isSubtest = metaGetterBoolean('isSubtest');

type TestPath = [Constructor | Function, ...(Constructor | Function)[]];

export function runTests<T, C extends { new(): T }>(t: C, stack: TestPath = [t]) {
    const proto = t.prototype;
    const tests: (['normal', () => void] | ['subtest', () => Constructor])[] = [];
    const afters: (() => void)[] = [];
    const befores: (() => void)[] = [];
    for (const k of Object.getOwnPropertyNames(proto)) {
        if (k in proto) {
            const f = proto[k];
            if (isAfter(f)) {
                afters.push(f);
            }
            if (isBefore(f)) {
                befores.push(f);
            }
            if (isTest(f)) {
                tests.push(['normal', f]);
            }
            if (isSubtest(f)) {
                tests.push(['subtest', f]);
            }
        }
    }
    const inst = new t();
    for (const tfun of tests) {
        const [_, fun] = tfun;
        if (shouldSkip(fun)) {
            continue;
        }
        for (const bef of befores) {
            bef.apply(inst);
        }
        try {
            if (tfun[0] === 'normal') {
                tfun[1].apply(inst);
            }
            if (tfun[0] === 'subtest') {
                const inner = tfun[1].apply(inst);
                runTests(inner, [inner, ...stack]);
            }
        } catch (e) {
            throw e;
        } finally {
            for (const aft of afters) {
                aft.apply(inst);
            }
        }
    }
}
