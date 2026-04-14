import { apiUploadImages } from "../../http/api";
import Dialog from "../../miniprogram_npm/@vant/weapp/dialog/dialog";

Page({
  data: {
    // 页面数据
    form: {
      account: "",
      code: "",
    },
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

  //测试上传
  async testUpload() {
    try {
      // 选择文档
      wx.chooseMessageFile({
        count: 9,
        type: "file",
        success: async (res) => {
          const filePaths = res.tempFiles.map(file => file.path);
          console.log(res, filePaths, '>>>')
          await apiUploadImages(filePaths);
        },
      });
      // 选择图片
      // const chooseRes = await wx.chooseMedia({
      //   count: 3,
      //   mediaType: ["image", "video"],
      // });
      // const filePaths = chooseRes.tempFiles.map(file => file.tempFilePath);
      // const res = await apiUploadImages(filePaths);
      // console.log("上传结果：", res);
    } catch (err) {
      console.error("上传异常：", err);
    }
  },

});
