declare module '@mystikonetwork/fastfile' {
  export function createNoOverride(o: any, b: any, c: any): any;

  export function createOverride(o: any, b: any, c: any): any;

  export function readExisting(o: any, b: any, c: any): any;

  export function readWriteExisting(o: any, b: any, c: any): any;

  export function readWriteExistingOrCreate(o: any, b: any, c: any): any;
}
