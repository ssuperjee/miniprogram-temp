type AnyFunc = (...args: any[]) => void;

export interface LeadFormData {
  name: string;
  mobile: string;
  city?: string;
  intention?: string;
  remark?: string;
  images?: string[];
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface UploadResponse<T = unknown> {
  statusCode: number;
  data: T | string;
  errMsg: string;
}

const submitLockMap: Record<string, boolean> = {};

export const CommonUtils = {
  /**
   * 计算导航栏高度 （状态栏 + 导航栏）
   */
  calculateNavBarHeight(): number {
    const windowApi = wx as typeof wx & {
      getWindowInfo?: () => Pick<WechatMiniprogram.SystemInfo, "statusBarHeight">;
    };
    const systemInfo = windowApi.getWindowInfo?.() || wx.getSystemInfoSync(); // 获取系统信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect(); // 获取胶囊按钮信息
    const statusBarHeight = systemInfo.statusBarHeight || 0; // 状态栏高度
    const navBarHeight =
      (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height; // 根据官方建议计算导航栏高度
    return statusBarHeight + navBarHeight;
  },

  /**
   * 去除对象中字符串字段首尾空格
   */
  trimObjectValues<T extends Record<string, unknown>>(source: T): T {
    const result: Record<string, unknown> = { ...source };
    Object.keys(result).forEach((key) => {
      const value = result[key];
      if (typeof value === "string") {
        result[key] = value.trim();
      }
    });
    return result as T;
  },

  /**
   * 是否为空值（null/undefined/空字符串/空数组）
   */
  isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === "string") {
      return value.trim().length === 0;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return false;
  },

  /**
   * 手机号校验（中国大陆）
   */
  validateMobile(mobile: string): ValidationResult {
    const normalized = mobile.replace(/\s+/g, "");
    if (!/^1[3-9]\d{9}$/.test(normalized)) {
      return { valid: false, message: "请输入正确的手机号" };
    }
    return { valid: true };
  },

  /**
   * 联系人姓名校验
   */
  validateName(name: string): ValidationResult {
    const normalized = name.trim();
    if (normalized.length < 2 || normalized.length > 30) {
      return { valid: false, message: "姓名长度需在2-30个字符之间" };
    }
    if (!/^[\u4e00-\u9fa5A-Za-z\s·.]+$/.test(normalized)) {
      return { valid: false, message: "姓名仅支持中英文、空格和分隔符" };
    }
    return { valid: true };
  },

  /**
   * 线索表单基础校验
   */
  validateLeadForm(form: LeadFormData): ValidationResult {
    const cleaned = this.trimObjectValues(form);
    if (this.isEmpty(cleaned.name)) {
      return { valid: false, message: "请输入联系人姓名" };
    }
    const nameResult = this.validateName(String(cleaned.name || ""));
    if (!nameResult.valid) {
      return nameResult;
    }
    if (this.isEmpty(cleaned.mobile)) {
      return { valid: false, message: "请输入手机号" };
    }
    const mobileResult = this.validateMobile(String(cleaned.mobile || ""));
    if (!mobileResult.valid) {
      return mobileResult;
    }
    return { valid: true };
  },

  /**
   * 对手机号做脱敏展示
   */
  maskMobile(mobile: string): string {
    const normalized = mobile.replace(/\s+/g, "");
    if (normalized.length !== 11) {
      return mobile;
    }
    return `${normalized.slice(0, 3)}****${normalized.slice(7)}`;
  },

  /**
   * 文本长度限制
   */
  limitText(text: string, maxLength: number): string {
    if (maxLength <= 0) {
      return "";
    }
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength);
  },

  /**
   * 防抖
   */
  debounce<T extends AnyFunc>(
    fn: T,
    delay = 300,
  ): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  },

  /**
   * 节流
   */
  throttle<T extends AnyFunc>(
    fn: T,
    delay = 300,
  ): (...args: Parameters<T>) => void {
    let lastTime = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastTime < delay) {
        return;
      }
      lastTime = now;
      fn(...args);
    };
  },

  /**
   * 带 loading 的异步执行器
   */
  async runWithLoading<T>(
    task: () => Promise<T>,
    title = "加载中",
  ): Promise<T> {
    wx.showLoading({ title, mask: true });
    try {
      return await task();
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 防止同一业务键重复提交
   */
  async withSubmitLock<T>(lockKey: string, task: () => Promise<T>): Promise<T> {
    if (submitLockMap[lockKey]) {
      throw new Error("请勿重复提交");
    }
    submitLockMap[lockKey] = true;
    try {
      return await task();
    } finally {
      submitLockMap[lockKey] = false;
    }
  },

  /**
   * 生成线索草稿缓存键
   */
  buildLeadDraftStorageKey(scene = "default"): string {
    return `lead_report_draft_${scene}`;
  },

  /**
   * 保存草稿
   */
  saveDraft<T extends Record<string, unknown>>(scene: string, data: T): void {
    const key = this.buildLeadDraftStorageKey(scene);
    wx.setStorageSync(key, data);
  },

  /**
   * 获取草稿
   */
  getDraft<T>(scene: string): T | null {
    const key = this.buildLeadDraftStorageKey(scene);
    const draft = wx.getStorageSync(key) as T | undefined;
    return draft === undefined ? null : draft;
  },

  /**
   * 清除草稿
   */
  clearDraft(scene: string): void {
    const key = this.buildLeadDraftStorageKey(scene);
    wx.removeStorageSync(key);
  },

  /**
   * 选择图片并返回临时路径
   */
  pickImages(count = 9): Promise<string[]> {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => resolve(res.tempFilePaths),
        fail: reject,
      });
    });
  },

  /**
   * 文件上传封装
   */
  uploadFile<T = unknown>(
    url: string,
    filePath: string,
    name = "file",
    formData: Record<string, unknown> = {},
    header: Record<string, string> = {},
  ): Promise<UploadResponse<T>> {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url,
        filePath,
        name,
        formData,
        header,
        success: (res) => {
          let data: T | string = res.data;
          if (typeof res.data === "string") {
            try {
              data = JSON.parse(res.data) as T;
            } catch {
              data = res.data;
            }
          }
          resolve({
            statusCode: res.statusCode,
            data,
            errMsg: res.errMsg,
          });
        },
        fail: reject,
      });
    });
  },

  /**
   * 构建提交参数（自动去空格并追加时间）
   */
  buildLeadPayload(form: LeadFormData): LeadFormData & { submitTime: string } {
    const cleaned = this.trimObjectValues(form);
    return {
      ...cleaned,
      submitTime: new Date().toISOString(),
    };
  },
};

export type CommonUtilsType = typeof CommonUtils;
