Page({
  /**
   * 页面初始数据
   */
  data: {
    modalShow: false, // 弹窗显示状态
    inputValue: '',   // 输入框内容
    modalSubmitting: false
  },

  /**
   * 打开弹窗
   */
  showModal() {
    this.setData({
      modalShow: true
    });
  },

  /**
   * beforeclose 拦截：
   * - 取消/遮罩：直接关闭
   * - 确认：请求成功才关闭，失败保持弹框
   */
  async handleModalBeforeClose(
    e: WechatMiniprogram.CustomEvent<{ source: 'cancel' | 'confirm' | 'overlay'; value: string }>
  ) {
    const { source, value } = e.detail;

    if (source !== 'confirm') {
      this.setData({
        modalShow: false,
        inputValue: ''
      });
      return;
    }

    const reason = value.trim();
    if (!reason) {
      wx.showToast({
        title: '请输入作废原因',
        icon: 'none'
      });
      return;
    }

    if (this.data.modalSubmitting) {
      return;
    }

    this.setData({
      modalSubmitting: true
    });

    try {
      await this.mockVoidRequest(reason);
      wx.showToast({
        title: '作废成功',
        icon: 'none'
      });
      this.setData({
        modalShow: false,
        inputValue: ''
      });
    } catch (error) {
      wx.showToast({
        title: '作废失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({
        modalSubmitting: false
      });
    }
  },

  handleModalClose() {
    if (!this.data.modalShow) {
      return;
    }
    this.setData({
      modalShow: false
    });
  },

  mockVoidRequest(_reason: string) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.4;
        if (success) {
          resolve();
          return;
        }
        reject(new Error('request failed'));
      }, 1200);
    });
  },

  /**
   * 输入框内容变化
   */
  handleModalInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({
      inputValue: e.detail.value
    });
  }
});