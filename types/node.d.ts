/// <reference types="node" />

declare namespace NodeJS {
  interface Global {
    readonly __DEV__: boolean;
  }
}
