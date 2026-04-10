import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog';

Page({
  data: {
    // 页面数据
  },

  onLoad() {
    // 页面加载时的逻辑
  },
  
  showModal() { 
    Dialog.alert({
      title: '提示',
      message: '这是一个模态框',
    }).then(() => {
      // on close
    });
  }
});
