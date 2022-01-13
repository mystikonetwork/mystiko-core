import protocol from '../protocol/index.js';

export const ID_KEY = '$loki';
export class BaseModel {
  constructor(data = {}) {
    this.data = data;
    this.protocol = protocol;
  }

  get id() {
    return this.data[ID_KEY];
  }

  get createdAt() {
    if (this.data['meta'] && this.data['meta']['created']) {
      return this.data['meta']['created'];
    }
    return 0;
  }

  get updatedAt() {
    if (this.data['meta'] && this.data['meta']['revision']) {
      return this.data['meta']['revision'];
    }
    return 0;
  }

  toString() {
    return JSON.stringify(this.data);
  }
}
