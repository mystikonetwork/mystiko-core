export type Proof = {
  a: G1;
  b: G2;
  c: G1;
};

export type G1 = {
  X: string;
  Y: string;
};

export type G2 = {
  X: string[];
  Y: string[];
};
