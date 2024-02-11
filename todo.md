# TODO

## Test

- FormApi
  - event subscription
    - [ ] set value
    - [ ] reset value
    - [ ] attach node
    - [ ] dettach node
    - [ ] set value on child
    - [ ] set error

## Features

- [ ] append errors in the field and the child fields
- [ ] validation debouncer
- [ ] array node helper functions
  - `swap|swapNode(indexA: number, indexB: number): void`
  - `move|moveNode(indexA: number, indexB: number): void`
  - `unshift|unshiftNode(value: T): void`
  - `append(value: T): void`
  - `remove(index: number): void`
  - `insert(index: number, value: T): void`
  - `update(index: number, value: T): void`
