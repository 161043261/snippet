/**
 * 1.1 "promise" 有 then 方法的对象或函数，行为符合本规范
 * 1.2 "thenable" 有 then 方法的对象或函数
 * 1.3 "value" 合法的 JS 值 (包括 undefined、thenable 或 promise)
 * 1.4 "exception" 使用 throw 语句抛出的值
 * 1.5 "reason" 代表 promise 被拒绝的原因
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// 2.1 promise 的三个状态：pending、fulfilled 或 rejected
enum PromiseState {
  PENDING = "pending",
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
}

type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (reason?: any) => void;
type OnFulfilled<T, TResult> =
  | ((value: T) => TResult | PromiseLike<TResult>)
  | undefined
  | null;
type OnRejected<TResult> =
  | ((reason: any) => TResult | PromiseLike<TResult>)
  | undefined
  | null;

class MyPromise<T = any> {
  // 2.1.1 pending 时
  // 2.1.1.1 promise 可以转换为 fulfilled 或 rejected
  private _state: PromiseState = PromiseState.PENDING;

  // 2.1.2 fulfilled 时
  // 2.1.2.1 promise 不能转换为其他状态
  // 2.1.2.2 必须有一个 value，且 value 不能改变
  // 不能改变即 ===，值类型是值不可变，引用类型是引用不可变
  private _value: any = undefined;

  // 2.1.3 rejected 时
  // 2.1.3.1 promise 不能转换为其他状态
  // 2.1.3.2 必须有一个 reason, 且 reason 不能改变
  // 不能改变即 ===，值类型是值不可变，引用类型是引用不可变
  private _reason: any = undefined;

  // 存储回调函数
  private _onFulfilledCallbacks: (() => void)[] = [];
  private _onRejectedCallbacks: (() => void)[] = [];

  constructor(executor: (resolve: Resolve<T>, reject: Reject) => void) {
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }

  // 2.3 The Promise Resolution Procedured

  /**
   * resolve promise
   * @param x
   * @returns
   */
  private _resolve(x: any): void {
    // 2.1.2.1 & 2.1.3.1 - State must be pending to transition
    if (this._state !== PromiseState.PENDING) return;

    // 2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason.
    if (x === this) {
      return this._reject(new TypeError("Chaining cycle detected for promise"));
    }

    // 2.3.2 If x is a promise, adopt its state
    // 如果 x 是一个 promise，则使用 x 的 state
    if (x instanceof MyPromise) {
      // Optimization: if x is a MyPromise, we can just hook into it directly
      if (x._state === PromiseState.PENDING) {
        x.then(
          (v: any) => this._resolve(v),
          (r: any) => this._reject(r),
        );
      } else if (x._state === PromiseState.FULFILLED) {
        this._fulfill(x._value);
      } else {
        this._reject(x._reason);
      }
      return;
    }

    // 2.3.3 否则，如果 x 是一个对象或函数，
    if (x !== null && (typeof x === "object" || typeof x === "function")) {
      let then;
      try {
        // 2.3.3.1 then = x.then
        then = x.then;
      } catch (error) {
        // 2.3.3.2 如果获取 x.then 导致抛出异常 e
        // 使用 e 作为 reason，reject promise
        return this._reject(error);
      }

      if (typeof then === "function") {
        // 2.3.3.3 如果 then 是函数, call it with x as this, first argument resolvePromise,
        // and second argument rejectPromise
        // 则使用 x 作为第一个参数 resolvePromise
        // 第二个参数 rejectPromise
        let called = false;
        try {
          then.call(
            x,
            (y: any) => {
              // 2.3.3.3.1 如果/当 resolvePromise 使用 y 调用，只想
              if (called) return;
              called = true;
              this._resolve(y);
            },
            (r: any) => {
              // 2.3.3.3.2 If/when rejectPromise is called with a reason r, reject promise with r.
              if (called) return;
              called = true;
              this._reject(r);
            },
          );
        } catch (error) {
          // 2.3.3.3.4 If calling then throws an exception e,
          // 2.3.3.3.4.1 If resolvePromise or rejectPromise have been called, ignore it.
          if (called) return;
          // 2.3.3.3.4.2 Otherwise, reject promise with e as the reason.
          this._reject(error);
        }
        return;
      }
    }

    // 2.3.3.4 If then is not a function, fulfill promise with x.
    // 2.3.4 If x is not an object or function, fulfill promise with x.
    this._fulfill(x);
  }

  private _fulfill(value: any): void {
    if (this._state !== PromiseState.PENDING) return;
    this._state = PromiseState.FULFILLED;
    this._value = value;

    const callbacks = this._onFulfilledCallbacks;
    this._onFulfilledCallbacks = []; // clear ref
    this._onRejectedCallbacks = []; // clear ref

    for (const callback of callbacks) {
      callback();
    }
  }

  private _reject(reason: any): void {
    if (this._state !== PromiseState.PENDING) return;
    this._state = PromiseState.REJECTED;
    this._reason = reason;

    const callbacks = this._onRejectedCallbacks;
    this._onFulfilledCallbacks = [];
    this._onRejectedCallbacks = [];

    for (const callback of callbacks) {
      callback();
    }
  }

  // 2.2 then 方法
  // promise 必须提供 then 方法，以访问其当前或最终的 value 或 reason
  // promise 的 then 方法接受两个参数
  public then<TResult1 = T, TResult2 = never>(
    // 2.2.1 onFulfilled 和 onRejected 都是可选参数
    onFulfilled?: OnFulfilled<T, TResult1>,
    onRejected?: OnRejected<TResult2>,
  ): MyPromise<TResult1 | TResult2> {
    // 2.2.7 then 方法必须返回一个 promise, 称为 promise2
    // then 方法的调用者称为 promise1
    return new MyPromise((resolve, reject) => {
      // 2.2.4 onFulfilled or onRejected must not be called until the execution context stack
      // contains only platform code.
      // onFulfilled 或 onRejected 必须在执行上下文栈仅包含平台代码之前调用
      //
      // 结论：promise.then 是微任务，使用 queueMicrotask
      // [queueMicrotask](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/queueMicrotask)

      const handleFulfilled = () => {
        queueMicrotask(() => {
          try {
            // 2.2.1.1 如果 onFulfilled 不是函数，则忽略
            // 2.2.7.3 如果 onFulfilled 不是函数, 且 promise1 是 fulfilled
            // 则 promise2 必须也 fulfilled，使用 promise1 的 value
            if (typeof onFulfilled !== "function") {
              resolve(this._value);
            } else {
              // 2.2.2 如果 onFulfilled 是函数
              // 2.2.2.1 必须在 promise fulfilled 后调用 onFulfilled，且使用 promise 的 value 作为第一个参数
              // 2.2.2.2 在 promise fulfilled 前不能调用 onFulfilled
              // 2.2.2.3 onFulfilled 只能调用 1 次
              // 2.2.5 onFulfilled 和 onRejected 必须作为函数调用（即 this === undefined）
              const x = onFulfilled.call(undefined, this._value);
              // 2.2.7.1 如果 onFulfilled 或 onRejected 返回值 x
              // 则使用 resolve(x) resolve then 方法返回的 promise2
              resolve(x);
            }
          } catch (e) {
            // 2.2.7.2 如果 onFulfilled 或 onRejected 抛出异常 e
            // 则使用 reject(e) reject then 方法返回的 promise2
            reject(e);
          }
        });
      };

      const handleRejected = () => {
        queueMicrotask(() => {
          try {
            // 2.2.1.2 如果 onRejected 不是函数，则忽略
            // 2.2.7.4 如果 onRejected 不是函数，且 promise1 是 rejected
            // 则 promise2 必须也 rejected，使用 promise1 的 reason
            if (typeof onRejected !== "function") {
              reject(this._reason);
            } else {
              // 2.2.3 如果 onRejected 是函数
              // 2.2.3.1 必须在 promise rejected 后调用 onRejected，且使用 promise 的 reason 作为第一个参数
              // 2.2.3.2 在 promise rejected 前不能调用 onRejected
              // 2.2.3.3 onRejected 只能调用 1 次
              // 2.2.5 onFulfilled 和 onRejected 必须作为函数调用（即 this === undefined）
              const x = onRejected.call(undefined, this._reason);
              resolve(x);
            }
          } catch (error) {
            reject(error);
          }
        });
      };

      if (this._state === PromiseState.FULFILLED) {
        // 2.2.2.1 必须在 promise fulfilled 后调用 onFulfilled，且使用 promise 的 value 作为第一个参数
        handleFulfilled();
      } else if (this._state === PromiseState.REJECTED) {
        // 2.2.3.1 必须在 promise rejected 后调用 onRejected，且使用 promise 的 reason 作为第一个参数
        handleRejected();
      } else {
        // 2.2.6 一个 promise 的 then 方法可以多次调用
        // 2.2.6.1 当 promise fulfilled 时，所有 onFulfilled 回调必须按序执行
        this._onFulfilledCallbacks.push(handleFulfilled);
        // 2.2.6.2 当 promise rejected 时，所有 onRejected 回调必须按序执行
        this._onRejectedCallbacks.push(handleRejected);
      }
    });
  }

  // 2.2.7.3 catch is sugar for then(undefined, onRejected)
  public catch<TResult = never>(
    onRejected?: OnRejected<TResult>,
  ): MyPromise<T | TResult> {
    return this.then(undefined, onRejected);
  }

  // Static methods for convenience and requirement
  static resolve(value: any): MyPromise<any> {
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason: any): MyPromise<never> {
    return new MyPromise((_, reject) => reject(reason));
  }

  // Optimize Promise.all for large arrays
  static all(promises: Iterable<any>): MyPromise<any[]> {
    return new MyPromise((resolve, reject) => {
      const input = Array.isArray(promises) ? promises : Array.from(promises);
      const len = input.length;

      if (len === 0) {
        resolve([]);
        return;
      }

      const results: any[] = new Array(len);
      let completed = 0;

      // Use a counter to track completion
      // We need to preserve order
      for (let i = 0; i < len; i++) {
        const item = input[i];

        // Optimization: Handle primitive values synchronously without creating promises
        if (
          item !== null &&
          (typeof item === "object" || typeof item === "function")
        ) {
          // It's an object or function, so it MIGHT be a thenable.
          // Let MyPromise.resolve handle it (including thenable check and state adoption).
          // If item is MyPromise, MyPromise.resolve(item) returns it directly (no wrapper).
          // If item is thenable, it creates a wrapper.
          MyPromise.resolve(item).then(
            (value) => {
              results[i] = value;
              completed++;
              if (completed === len) {
                resolve(results);
              }
            },
            (reason) => {
              // First rejection rejects all
              reject(reason);
            },
          );
        } else {
          // Primitive value (number, string, boolean, undefined, symbol)
          // Cannot be a thenable.
          results[i] = item;
          completed++;
          if (completed === len) {
            resolve(results);
          }
        }
      }
    });
  }

  static race(promises: Iterable<any>): MyPromise<any> {
    return new MyPromise((resolve, reject) => {
      const input = Array.isArray(promises) ? promises : Array.from(promises);
      for (const item of input) {
        MyPromise.resolve(item).then(resolve, reject);
      }
    });
  }
}

export default MyPromise;
