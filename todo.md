# TODO

## Test

- FieldGroupNode
  - event subscription
    - [x] set value
    - [x] reset value
    - [x] attach node
    - [x] dettach node
    - [x] set value on parent
    - [x] set value on child
    - [x] set error
    - [x] set error on parent

- FormApi
  - event subscription
    - [ ] set value
    - [ ] reset value
    - [ ] attach node
    - [ ] dettach node
    - [ ] set value on parent
    - [ ] set value on child
    - [ ] set error
    - [ ] set error on parent

## Features

- [ ] append errors in the field and the child fields
- [ ] field destroy on unregister `dispose`
- [ ] validation debouncer
- [ ] array node helper functions
  - `swap|swapNode(indexA: number, indexB: number): void`
  - `move|moveNode(indexA: number, indexB: number): void`
  - `unshift|unshiftNode(value: T): void`
  - `append(value: T): void`
  - `remove(index: number): void`
  - `insert(index: number, value: T): void`
  - `update(index: number, value: T): void`
