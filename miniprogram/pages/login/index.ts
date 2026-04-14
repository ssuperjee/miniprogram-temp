import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";

Page({
  data: {
    // 页面数据
    form:{
      acount: '',
      code: ''
    }
  },
  onChange(event: any) {
    // event.detail 为当前输入的值
    console.log(event.detail);
  },
  onLoad() {
    // 页面加载时的逻辑
    const h = wx.utils.common.calculateNavBarHeight();
    console.log("导航栏高度:", h);
  },
  onShow() {
    wx.hideTabBar({
      animation: false,
    });
  },

  showModal() {
    Dialog.alert({
      title: "提示",
      message: "这是一个模态框",
    }).then(() => {
      // on close
    });
  },
});
