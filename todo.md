# TODO

## Test

- FieldGroupNode
  - path
    - [ ] field composition
    - [ ] path
  - pub/sub
    - [ ] notification
    - [ ] subscription
  - node composition
    - [ ] attach node
    - [ ] detach node
    - [ ] list node
    - [ ] get node
  - value
    - [x] initial value
    - [x] get/set value
    - [x] reset value
    - [x] patch value
    - [x] extract value
  - error manipulation
    - [x] set errors
    - [x] get errors
    - [x] validation fn
  - state management
    - [x] focus within
    - [x] blur within
    - [x] valid
    - [x] dirty
    - [x] modified
    - [x] touched

- FormApi
  - submit
    - [ ] error verification
    - [ ] submit error
  - path
    - [ ] field composition
    - [ ] path
  - pub/sub
    - [ ] notification
    - [ ] subscription
  - node composition
    - [ ] attach node
    - [ ] detach node
    - [ ] list node
    - [ ] get node
  - value
    - [ ] get/set value
    - [ ] reset value
    - [ ] patch value
    - [ ] delete value
    - [ ] extract value
  - error
    - [ ] validation fn
    - [ ] validation trigger
    - [ ] extract error
    - [ ] set errors
    - [ ] get errors
  - state change
    - [ ] focus within
    - [ ] blur within
    - [ ] valid
    - [ ] dirty
    - [ ] modified
    - [ ] touched

## Features

- [ ] form validation
- [ ] form submition
- [ ] clear form errors
- [ ] field destroy on unregister
- [ ] array node helper functions
  - `swap|swapNode(indexA: number, indexB: number): void`
  - `move|moveNode(indexA: number, indexB: number): void`
  - `unshift|unshiftNode(value: T): void`
  - `append(value: T): void`
  - `remove(index: number): void`
  - `insert(index: number, value: T): void`
  - `update(index: number, value: T): void`

## react-hook-form

- [useForm options](https://react-hook-form.com/docs/useform)
