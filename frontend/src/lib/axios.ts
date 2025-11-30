import axios from 'axios'
import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'

export function createAxiosInstance(baseURL: string): AxiosInstance {
  const axiosInstance = axios.create({
    baseURL,
    withCredentials: true, // This ensures cookies are sent with every request
  })

  let isRefreshing = false
  const failedQueue: Array<{
    resolve: (value?: unknown) => void
    reject: (reason?: unknown) => void
  }> = []

  const processQueue = (error: unknown = null) => {
    failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error)
      } else {
        promise.resolve()
      }
    })
    failedQueue.length = 0 // Clear the queue after processing
  }

  const getNewAccessToken = () => {
    return axiosInstance.get('/auth/refresh-token')
  }

  type CustomAxiosRequestConfig = {
    _retry?: boolean
  } & InternalAxiosRequestConfig

  axiosInstance.interceptors.response.use(
    undefined,
    async (error: AxiosError) => {
      const originalRequest = error.config as CustomAxiosRequestConfig

      // Only handle 401 errors
      if (error.response?.status !== 401) {
        return Promise.reject(error)
      }

      // Don't retry if we've already tried
      if (originalRequest._retry) {
        return Promise.reject(error)
      }

      // Don't try to refresh if the failed request was the refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => axiosInstance.request(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      isRefreshing = true

      try {
        await getNewAccessToken()
        processQueue()
        return axiosInstance.request(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        // If refresh fails, user needs to log in again
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    },
  )

  return axiosInstance
}

export const api = createAxiosInstance('http://localhost:5000/api')
