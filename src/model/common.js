export const ID_KEY = '$loki';
export class BaseModel {
  constructor(data = {}) {
    this.data = data;
  }

  get id() {
    return this.data[ID_KEY];
  }
}
