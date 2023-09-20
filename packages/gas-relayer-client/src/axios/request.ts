import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { RelayerError, RelayerErrorCode, ResponseData } from '../types';

export class Request {
  instance: AxiosInstance;

  baseConfig: AxiosRequestConfig = { timeout: 60000 };

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(Object.assign(this.baseConfig, config));
    this.instance.interceptors.response.use(
      (res: AxiosResponse) => res,
      (err: AxiosError) =>
        Promise.reject(new RelayerError(RelayerErrorCode.REQUEST_SERVER_ERROR, err.message)),
    );
  }

  public request(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.instance.request(config);
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ResponseData<T>>> {
    return this.instance.get(url, config);
  }

  public post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<ResponseData<T>>> {
    return this.instance.post(url, data, config);
  }
}

export default new Request({});
