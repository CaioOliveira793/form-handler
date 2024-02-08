# TODO

## Test

- FieldNode
  - error manipulation
    - [x] get all form errors
    - [x] clear errors
    - [x] clear all form errors

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
  - node composition
    - [x] attach node
    - [x] detach node
    - [x] get node
    - [x] iterate node
    - [x] iterate node field
    - [x] iterate node entries
  - value
    - [x] initial value
    - [x] get/set value
    - [x] reset value
    - [x] patch value
    - [x] extract value
  - error manipulation
    - [x] set errors
    - [x] get errors
    - [x] get all form errors
    - [x] clear errors
    - [x] clear all form errors
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
    - [x] validation error
    - [x] submit error
    - [x] submit success
    - [x] background submit
  - path
    - [ ] field composition
    - [ ] path
  - event subscription
    - [ ] set value
    - [ ] reset value
    - [ ] attach node
    - [ ] dettach node
    - [ ] set value on parent
    - [ ] set value on child
    - [ ] set error
    - [ ] set error on parent
  - node composition
    - [ ] attach node
    - [ ] detach node
    - [ ] get node
    - [ ] iterate node
    - [ ] iterate node field
    - [ ] iterate node entries
  - value
    - [ ] initial value
    - [ ] get/set value
    - [ ] reset value
    - [ ] patch value
    - [ ] extract value
  - error
    - [ ] validation fn
    - [ ] validation trigger
    - [ ] extract error
    - [x] set errors
    - [x] get errors
    - [x] get all form errors
    - [x] clear errors
    - [x] clear all form errors
  - state management
    - [ ] focus within
    - [ ] blur within
    - [ ] valid
    - [ ] dirty
    - [ ] modified
    - [ ] touched

## Error manipulation

- [x] replate/set errors in the field and the child fields
- [x] return all errors in the form api
- [ ] append errors in the field and the child fields
- [x] clear errors in the field
- [x] clear all errors in the form api

## State management

- [ ] add target node in `isValid` state fn

## Features

- [ ] form validation
- [x] form submission
- [x] clear form errors
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
