/* eslint-disable @typescript-eslint/no-explicit-any */
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
  // 2.1.1 When pending, a promise:
  // 2.1.1.1 may transition to either the fulfilled or rejected state.
  private _state: PromiseState = PromiseState.PENDING;

  // 2.1.2 When fulfilled, a promise:
  // 2.1.2.1 must not transition to any other state.
  // 2.1.2.2 must have a value, which must not change.
  private _value: any = undefined;

  // 2.1.3 When rejected, a promise:
  // 2.1.3.1 must not transition to any other state.
  // 2.1.3.2 must have a reason, which must not change.
  private _reason: any = undefined;

  // Store callbacks to handle asynchronous resolution
  private _onFulfilledCallbacks: (() => void)[] = [];
  private _onRejectedCallbacks: (() => void)[] = [];

  constructor(executor: (resolve: Resolve<T>, reject: Reject) => void) {
    try {
      executor(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }

  // 2.3 The Promise Resolution Procedure
  // [[Resolve]](promise, x)
  private _resolve(x: any): void {
    // 2.1.2.1 & 2.1.3.1 - State must be pending to transition
    if (this._state !== PromiseState.PENDING) return;

    // 2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason.
    if (x === this) {
      return this._reject(new TypeError("Chaining cycle detected for promise"));
    }

    // 2.3.2 If x is a promise, adopt its state
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

    // 2.3.3 Otherwise, if x is an object or function
    if (x !== null && (typeof x === "object" || typeof x === "function")) {
      let then;
      try {
        // 2.3.3.1 Let then be x.then
        then = x.then;
      } catch (error) {
        // 2.3.3.2 If retrieving the property x.then results in a thrown exception e,
        // reject promise with e as the reason.
        return this._reject(error);
      }

      if (typeof then === "function") {
        // 2.3.3.3 If then is a function, call it with x as this, first argument resolvePromise,
        // and second argument rejectPromise
        let called = false;
        try {
          then.call(
            x,
            (y: any) => {
              // 2.3.3.3.1 If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
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

  // 2.2 The then Method
  public then<TResult1 = T, TResult2 = never>(
    onFulfilled?: OnFulfilled<T, TResult1>,
    onRejected?: OnRejected<TResult2>,
  ): MyPromise<TResult1 | TResult2> {
    // 2.2.7 then must return a promise
    return new MyPromise((resolve, reject) => {
      // 2.2.4 onFulfilled or onRejected must not be called until the execution context stack
      // contains only platform code. -> Use queueMicrotask

      const handleFulfilled = () => {
        queueMicrotask(() => {
          try {
            // 2.2.1.1 If onFulfilled is not a function, it must be ignored.
            // 2.2.7.3 If onFulfilled is not a function and promise1 is fulfilled,
            // promise2 must be fulfilled with the same value as promise1.
            if (typeof onFulfilled !== "function") {
              resolve(this._value);
            } else {
              // 2.2.2.1 it must be called after promise is fulfilled, with promise’s value as its first argument.
              // 2.2.5 onFulfilled and onRejected must be called as functions (with no this value).
              // Explicitly call with undefined context
              const x = onFulfilled.call(undefined, this._value);
              // 2.2.7.1 If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
              resolve(x);
            }
          } catch (error) {
            // 2.2.7.2 If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
            reject(error);
          }
        });
      };

      // const handleFulfilled = () => {
      //   // Use setTimeout to ensure async execution (macro-task) which might be more compatible with the test suite
      //   setTimeout(() => {
      //     try {
      //       // 2.2.1.1 If onFulfilled is not a function, it must be ignored.
      //       // 2.2.7.3 If onFulfilled is not a function and promise1 is fulfilled,
      //       // promise2 must be fulfilled with the same value as promise1.
      //       if (typeof onFulfilled !== "function") {
      //         resolve(this._value);
      //       } else {
      //         // 2.2.2.1 it must be called after promise is fulfilled, with promise’s value as its first argument.
      //         // 2.2.5 onFulfilled and onRejected must be called as functions (with no this value).
      //         // Explicitly call with undefined context
      //         const x = onFulfilled.call(undefined, this._value);
      //         // 2.2.7.1 If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
      //         resolve(x);
      //       }
      //     } catch (error) {
      //       // 2.2.7.2 If either onFulfilled or onRejected throws an exception e, promise2 must be rejected with e as the reason.
      //       reject(error);
      //     }
      //   }, 0);
      // };

      const handleRejected = () => {
        queueMicrotask(() => {
          try {
            // 2.2.1.2 If onRejected is not a function, it must be ignored.
            // 2.2.7.4 If onRejected is not a function and promise1 is rejected,
            // promise2 must be rejected with the same reason as promise1.
            if (typeof onRejected !== "function") {
              reject(this._reason);
            } else {
              // 2.2.3.1 it must be called after promise is rejected, with promise’s reason as its first argument.
              // Explicitly call with undefined context
              const x = onRejected.call(undefined, this._reason);
              resolve(x);
            }
          } catch (error) {
            reject(error);
          }
        });
      };

      // const handleRejected2 = () => {
      //   setTimeout(() => {
      //     try {
      //       // 2.2.1.2 If onRejected is not a function, it must be ignored.
      //       // 2.2.7.4 If onRejected is not a function and promise1 is rejected,
      //       // promise2 must be rejected with the same reason as promise1.
      //       if (typeof onRejected !== "function") {
      //         reject(this._reason);
      //       } else {
      //         // 2.2.3.1 it must be called after promise is rejected, with promise’s reason as its first argument.
      //         // Explicitly call with undefined context
      //         const x = onRejected.call(undefined, this._reason);
      //         resolve(x);
      //       }
      //     } catch (error) {
      //       reject(error);
      //     }
      //   }, 0);
      // };

      if (this._state === PromiseState.FULFILLED) {
        handleFulfilled();
      } else if (this._state === PromiseState.REJECTED) {
        handleRejected();
      } else {
        // 2.2.6 then may be called multiple times on the same promise.
        this._onFulfilledCallbacks.push(handleFulfilled);
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
