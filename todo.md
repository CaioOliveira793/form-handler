# TODO

## Test

- FieldNode
  - path
    - [ ] field composition
    - [ ] path
  - pub/sub
    - [ ] notification
    - [ ] subscription
  - value
    - [x] get/set value
    - [x] reset value
  - error
    - [x] replace errors
    - [x] append errors
    - [x] get errors
  - state change
    - [x] focus
    - [x] blur
    - [x] valid
    - [x] dirty
    - [x] modified
    - [x] touched

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
    - [ ] get/set value
    - [ ] reset value
    - [ ] patch value
    - [ ] delete value
    - [ ] extract value
  - error
    - [ ] extract error
  - state change
    - [ ] focus within
    - [ ] blur within
    - [ ] valid
    - [ ] dirty
    - [ ] modified
    - [ ] touched

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
    - [ ] validation
    - [ ] validation trigger
    - [ ] extract error
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
- [ ] clear field errors
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
- [ ] use the [HTML startdard for form validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)

## react-hook-form

- [useForm options](https://react-hook-form.com/docs/useform)
