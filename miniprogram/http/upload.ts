/**
 * 微信小程序通用上传工具（支持图片、文档、txt、zip、pdf、excel、word 等所有文件）
 */
import { config as appConfig } from '../config/index'

// 基础配置
const requestConfig = {
  baseUrl: appConfig.baseUrl, // 你的接口地址
  timeout: 10000,
};

interface UploadOption {
  url: string;
  filePath: string;
  name?: string;
  formData?: Record<string, any>;
  loading?: boolean;
  loadingText?: string;
  noToken?: boolean;
}

/**
 * 单文件通用上传
 */
export function uploadFile<T = any>(option: UploadOption): Promise<T> {
  const {
    url,
    filePath,
    name = "file",
    formData = {},
    loading = true,
    loadingText = "上传中...",
    noToken = false,
  } = option;

  if (loading) {
    wx.showLoading({ title: loadingText, mask: true });
  }

  const token = wx.getStorageSync("token") || "";
  const header: Record<string, string> = {};
  if (token && !noToken) {
    header["Authorization"] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: requestConfig.baseUrl + url,
      filePath,
      name,
      formData,
      header,

      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0 || data.code === 200) {
            resolve(data as T);
          } else {
            wx.showToast({
              title: data.msg || "上传失败",
              icon: "none",
            });
            reject(data);
          }
        } catch (e) {
          wx.showToast({ title: "返回数据格式错误", icon: "none" });
          reject(e);
        }
      },

      fail: (err) => {
        wx.showToast({ title: "上传失败，请检查网络", icon: "none" });
        reject(err);
      },

      complete: () => {
        if (loading) {
          wx.hideLoading();
        }
      },
    });
  });
}

/**
 * 容错版多文件串行上传
 */
export async function uploadFiles<T = any>(
  options: Omit<UploadOption, "filePath"> & {
    filePaths: string[];
  }
): Promise<{
  success: { data: T; index: number; filePath: string }[];
  fail: { error: any; index: number; filePath: string }[];
}> {
  const { filePaths, ...rest } = options;
  const success: any[] = [];
  const fail: any[] = [];

  for (let i = 0; i < filePaths.length; i++) {
    try {
      const data = await uploadFile({ ...rest, filePath: filePaths[i] });
      success.push({ data, index: i, filePath: filePaths[i] });
    } catch (err) {
      fail.push({ error: err, index: i, filePath: filePaths[i] });
    }
  }

  return { success, fail };
}

export default {
  uploadFile,
  uploadFiles,
};