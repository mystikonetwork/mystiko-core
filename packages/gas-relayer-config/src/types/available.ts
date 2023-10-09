export type AvailableData = {
  request: AvailableRequest;
  response?: AvailableResponse;
};

export type AvailableRequest = {
  timestamp: number;
};

export type AvailableResponse = {
  available: boolean;
  timestamp?: number;
};
