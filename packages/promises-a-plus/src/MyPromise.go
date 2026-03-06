package main

import (
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

// State represents the state of a promise
type State string

const (
	Pending   State = "pending"
	Fulfilled State = "fulfilled"
	Rejected  State = "rejected"
)

// MyPromise implementation
type MyPromise struct {
	state     State
	value     any
	reason    any
	callbacks []func()
	lock      sync.Mutex
}

// NewPromise creates a new promise
func NewPromise(executor func(resolve func(any), reject func(any))) *MyPromise {
	p := &MyPromise{
		state:     Pending,
		callbacks: make([]func(), 0),
	}

	resolve := func(value any) {
		p.resolve(value)
	}
	reject := func(reason any) {
		p.reject(reason)
	}

	// Run executor synchronously, but handle panics
	go func() {
		defer func() {
			if r := recover(); r != nil {
				p.reject(r)
			}
		}()
		executor(resolve, reject)
	}()

	return p
}

// resolve implementation
func (p *MyPromise) resolve(x any) {
	if x == p {
		p.reject(errors.New("Chaining cycle detected for promise"))
		return
	}

	if promise, ok := x.(*MyPromise); ok {
		if promise.state == Pending {
			promise.Then(
				func(v any) any {
					p.resolve(v)
					return nil
				},
				func(r any) any {
					p.reject(r)
					return nil
				},
			)
		} else if promise.state == Fulfilled {
			p.fulfill(promise.value)
		} else if promise.state == Rejected {
			p.reject(promise.reason)
		}
		return
	}

	// Handle thenables (simplified for Go: check if it has a Then method is hard without reflection or interface)
	// For simplicity, we assume x is a value unless it's a MyPromise
	p.fulfill(x)
}

func (p *MyPromise) fulfill(value any) {
	p.lock.Lock()
	defer p.lock.Unlock()

	if p.state != Pending {
		return
	}

	p.state = Fulfilled
	p.value = value

	for _, callback := range p.callbacks {
		callback()
	}
	p.callbacks = nil
}

func (p *MyPromise) reject(reason any) {
	p.lock.Lock()
	defer p.lock.Unlock()

	if p.state != Pending {
		return
	}

	p.state = Rejected
	p.reason = reason

	for _, callback := range p.callbacks {
		callback()
	}
	p.callbacks = nil
}

// Then method
func (p *MyPromise) Then(onFulfilled func(any) any, onRejected func(any) any) *MyPromise {
	return NewPromise(func(resolve func(any), reject func(any)) {
		handle := func() {
			var callback func(any) any
			if p.state == Fulfilled {
				callback = onFulfilled
			} else {
				callback = onRejected
			}

			if callback == nil {
				if p.state == Fulfilled {
					resolve(p.value)
				} else {
					reject(p.reason)
				}
				return
			}

			defer func() {
				if r := recover(); r != nil {
					reject(r)
				}
			}()

			var arg any
			if p.state == Fulfilled {
				arg = p.value
			} else {
				arg = p.reason
			}

			result := callback(arg)
			resolve(result)
		}

		p.lock.Lock()
		if p.state == Pending {
			p.callbacks = append(p.callbacks, handle)
			p.lock.Unlock()
		} else {
			p.lock.Unlock()
			// Execute asynchronously
			go handle()
		}
	})
}

// Catch method
func (p *MyPromise) Catch(onRejected func(any) any) *MyPromise {
	return p.Then(nil, onRejected)
}

// Finally method
func (p *MyPromise) Finally(onFinally func()) *MyPromise {
	return p.Then(
		func(value any) any {
			if onFinally != nil {
				onFinally()
			}
			return value
		},
		func(reason any) any {
			if onFinally != nil {
				onFinally()
			}
			// Propagate the rejection
			// We need a way to re-throw, in Go we can return a rejected promise or just the reason?
			// The current implementation of Then resolves with the return value.
			// To reject, we'd need to return a Promise that rejects.
			// Or we change Then implementation.
			// For simplicity in this port, we'll assume the next Then will handle it as value if not a promise.
			// But to strictly follow spec, we should return a rejected promise here.
			return Resolve(nil).Then(func(_ any) any {
				panic(reason) // Re-throw to reject
			}, nil)
		},
	)
}

// Static methods

func Resolve(value any) *MyPromise {
	return NewPromise(func(resolve func(any), reject func(any)) {
		resolve(value)
	})
}

func Reject(reason any) *MyPromise {
	return NewPromise(func(resolve func(any), reject func(any)) {
		reject(reason)
	})
}

func All(promises []any) *MyPromise {
	return NewPromise(func(resolve func(any), reject func(any)) {
		if len(promises) == 0 {
			resolve([]any{})
			return
		}

		results := make([]any, len(promises))
		completed := int32(0)
		total := int32(len(promises))

		for i, item := range promises {
			idx := i // capture loop variable
			Resolve(item).Then(
				func(value any) any {
					results[idx] = value
					if atomic.AddInt32(&completed, 1) == total {
						resolve(results)
					}
					return nil
				},
				func(reason any) any {
					reject(reason)
					return nil
				},
			)
		}
	})
}

func AllSettled(promises []any) *MyPromise {
	return NewPromise(func(resolve func(any), reject func(any)) {
		if len(promises) == 0 {
			resolve([]any{})
			return
		}

		results := make([]any, len(promises))
		completed := int32(0)
		total := int32(len(promises))

		for i, item := range promises {
			idx := i
			Resolve(item).Then(
				func(value any) any {
					results[idx] = map[string]any{
						"status": "fulfilled",
						"value":  value,
					}
					if atomic.AddInt32(&completed, 1) == total {
						resolve(results)
					}
					return nil
				},
				func(reason any) any {
					results[idx] = map[string]any{
						"status": "rejected",
						"reason": reason,
					}
					if atomic.AddInt32(&completed, 1) == total {
						resolve(results)
					}
					return nil
				},
			)
		}
	})
}

func Race(promises []any) *MyPromise {
	return NewPromise(func(resolve func(any), reject func(any)) {
		for _, item := range promises {
			Resolve(item).Then(
				func(value any) any {
					resolve(value)
					return nil
				},
				func(reason any) any {
					reject(reason)
					return nil
				},
			)
		}
	})
}

func Any(promises []any) *MyPromise {
	return NewPromise(func(resolve func(any), reject func(any)) {
		if len(promises) == 0 {
			reject(errors.New("All promises were rejected"))
			return
		}

		errorsList := make([]any, len(promises))
		rejectedCount := int32(0)
		total := int32(len(promises))

		for i, item := range promises {
			idx := i
			Resolve(item).Then(
				func(value any) any {
					resolve(value)
					return nil
				},
				func(reason any) any {
					errorsList[idx] = reason
					if atomic.AddInt32(&rejectedCount, 1) == total {
						reject(fmt.Errorf("All promises were rejected: %v", errorsList))
					}
					return nil
				},
			)
		}
	})
}

func Try(fn func() any) *MyPromise {
	return NewPromise(func(resolve func(any), reject func(any)) {
		defer func() {
			if r := recover(); r != nil {
				reject(r)
			}
		}()
		resolve(fn())
	})
}

func WithResolvers() (*MyPromise, func(any), func(any)) {
	var resolveFunc func(any)
	var rejectFunc func(any)

	p := NewPromise(func(resolve func(any), reject func(any)) {
		resolveFunc = resolve
		rejectFunc = reject
	})

	return p, resolveFunc, rejectFunc
}

func main() {
	fmt.Println("Start MyPromise Go Test")

	// Basic Resolve
	p1 := Resolve(10)
	p1.Then(func(v any) any {
		fmt.Printf("p1 resolved with: %v\n", v)
		return v.(int) * 2
	}, nil).Then(func(v any) any {
		fmt.Printf("p1 chain resolved with: %v\n", v)
		return nil
	}, nil)

	// Async Resolve
	p2 := NewPromise(func(resolve func(any), reject func(any)) {
		go func() {
			time.Sleep(100 * time.Millisecond)
			resolve("Async Hello")
		}()
	})
	p2.Then(func(v any) any {
		fmt.Printf("p2 resolved with: %v\n", v)
		return nil
	}, nil)

	// All
	p3 := Resolve(1)
	p4 := Resolve(2)
	All([]any{p3, p4}).Then(func(v any) any {
		fmt.Printf("All resolved with: %v\n", v)
		return nil
	}, nil)

	// Wait for async operations
	time.Sleep(500 * time.Millisecond)
	fmt.Println("End MyPromise Go Test")
}
