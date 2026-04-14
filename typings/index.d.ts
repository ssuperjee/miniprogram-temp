/// <reference path="./types/index.d.ts" />
/// <reference path="./types/wx/lib.wx.api.extensions.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}