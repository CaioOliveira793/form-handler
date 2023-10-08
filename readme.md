# Ultimate form

Ultimate form state management library.

## Features

<!-- TODO: performance, web core (no framework), modular (use custom form values) -->

<!-- TODO: add integration for Vue and React -->
<!-- TODO: add adapter validation for Zod, Yup and Joi -->

- Typed API
- Integration with UI libraries
- Support for validation libraries (Zod)
- [Small bundle size](https://bundlephobia.com/package/ultimate-form@0.1.0) and [zero dependencies](package.json)

## Usage

The `ultimate-form` API is based around the composition of a hierarchy of fields acting as nodes in a tree structure.

<!-- TODO: add an image showing the field nodes and their connections -->

<!-- TODO: add quick example -->

## Development

Clone the repo and run `pnpm install`.

### Testing

To run the tests, use the package script `test` or `test:cov` for code coverage.

### Building

To build the js files, run `build:js` and `build:type` for typescript declaration files.

For a full build (`.d.ts`, `.js`), run the `build` script.

## License

[MIT License](LICENSE)
