type ModalCloseSource = "cancel" | "confirm" | "overlay";
type ModalPhase = "hidden" | "entering" | "shown" | "leaving";

const DEFAULT_CURSOR_SPACING = 20;
const DEFAULT_KEYBOARD_OFFSET = 12;
const DEFAULT_ANIMATION_DURATION = 260;

/**
 * 通用输入模态框组件
 *
 * 功能：
 * 1. 支持标题、描述、textarea 输入与确认/取消按钮。
 * 2. 支持键盘弹起时的弹窗上移避让。
 * 3. 通过事件向父组件同步输入值与关闭/确认行为。
 *
 * 主要事件：
 * - change: 输入变化
 * - cancel: 点击取消
 * - confirm: 点击确认
 * - beforeclose: 关闭前拦截（beforeClose=true 时触发）
 * - close: 弹窗关闭（含来源）
 * - update:show: 通知父组件更新显示状态
 */

Component({
  options: {
    multipleSlots: true,
  },
  properties: {
    // 是否显示弹窗，默认 false
    // 关闭时会自动重置上移位移
    show: {
      type: Boolean,
      value: false,
      observer(nextShow: boolean) {
        if (nextShow) {
          this.openWithAnimation();
          return;
        }

        if (this.data.phase === "hidden") {
          this.resetInputPosition();
          return;
        }

        this.setModalState("leaving", {
          panelShift: 0,
          keyboardHeight: 0,
        });
        this.startLeaveTimer();
      },
    },
    title: {
      type: String,
      value: "",
    },
    // 标题前图标图片路径（本地路径或网络地址），为空则不显示
    titleIcon: {
      type: String,
      value: "",
    },
    // 标题图标尺寸（rpx）
    titleIconSize: {
      type: Number,
      value: 34,
    },
    // 描述文案（如线索编号）
    desc: {
      type: String,
      value: "",
    },
    // 输入框值（受控），默认空字符串
    value: {
      type: String,
      value: "",
      // 支持外部受控更新输入值
      observer(newValue: string) {
        this.setData({
          innerValue: newValue,
        });
      },
    },
    placeholder: {
      type: String,
      value: "请输入内容",
    },
    // 最多可输入字符数，默认 200
    maxlength: {
      type: Number,
      value: 200,
    },
    // textarea 是否自适应高度
    autoHeight: {
      type: Boolean,
      value: false,
    },
    // textarea 最大高度（rpx），超出后内部滚动，避免顶出弹窗
    textareaMaxHeight: {
      type: Number,
      value: 200,
    },
    // 弹窗打开后是否自动聚焦输入框，默认 false
    focus: {
      type: Boolean,
      value: false,
    },
    // 点击遮罩是否关闭弹窗，默认 true
    closeOnClickOverlay: {
      type: Boolean,
      value: false,
    },
    // 是否展示取消按钮，默认 true
    showCancel: {
      type: Boolean,
      value: true,
    },
    // 取消按钮文案，默认“取消”
    cancelText: {
      type: String,
      value: "取消",
    },
    // 确认按钮文案，默认“确认”
    confirmText: {
      type: String,
      value: "确认",
    },
    // 是否禁用确认按钮，默认 false
    confirmDisabled: {
      type: Boolean,
      value: false,
    },
    // 确认按钮加载状态（true 时禁用确认并显示加载态）
    confirmLoading: {
      type: Boolean,
      value: false,
    },
    // 是否在确认关闭前先触发拦截事件 beforeclose（由父组件决定是否关闭）
    beforeClose: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    innerValue: "",
    panelShift: 0,
    keyboardHeight: 0,
    phase: "hidden" as ModalPhase,
    visible: false,
    active: false,
  },
  lifetimes: {
    attached() {
      this.setData({
        innerValue: this.data.value,
      });
      this.setModalState(this.data.show ? "shown" : "hidden");
    },
    detached() {
      this.clearLeaveTimer();
    },
  },
  methods: {
    noop() {},
    // textarea 输入时同步内部值，并向外抛出 input/change 事件
    onTextareaInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const nextValue = event.detail.value;
      this.setData({
        innerValue: nextValue,
      });

      if (this.data.autoHeight && this.data.keyboardHeight > 0) {
        this.scheduleKeyboardAdjust();
      }
    },
    // 失焦时同步一次最终值，减少输入法合成阶段干扰
    onTextareaBlur(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const nextValue = event.detail.value;
      this.setData({
        innerValue: nextValue,
      });
      this.triggerEvent("change", {
        value: nextValue,
      });
    },
    onKeyboardHeightChange(
      event: WechatMiniprogram.CustomEvent<{
        height: number;
        duration: number;
      }>,
    ) {
      const { height } = event.detail;
      if (height <= 0) {
        this.resetInputPosition();
        return;
      }

      this.setData({
        keyboardHeight: height,
      });
      this.adjustPanelForKeyboard(height);
    },
    onMaskTap() {
      if (!this.data.closeOnClickOverlay) {
        return;
      }
      this.requestClose("overlay");
    },
    onCancel() {
      this.triggerEvent("cancel", {
        value: this.data.innerValue,
      });
      this.requestClose("cancel");
    },
    onConfirm() {
      if (this.data.confirmDisabled || this.data.confirmLoading) {
        return;
      }

      this.triggerEvent("change", {
        value: this.data.innerValue,
      });
      this.triggerEvent("confirm", {
        value: this.data.innerValue,
      });
      this.requestClose("confirm");
    },
    requestClose(source: ModalCloseSource) {
      if (this.data.beforeClose && source === "confirm") {
        this.triggerEvent("beforeclose", {
          source,
          value: this.data.innerValue,
        });
        return;
      }

      this.emitClose(source);
    },
    emitClose(source: ModalCloseSource) {
      this.resetInputPosition();

      if (this.data.phase !== "hidden") {
        this.setModalState("leaving");
        this.startLeaveTimer();
      }

      // 关闭时统一抛出 close 和 update:show，便于父组件处理状态
      this.triggerEvent("close", {
        source,
        value: this.data.innerValue,
      });
      this.triggerEvent("update:show", {
        value: false,
        source,
      });
    },
    // 供父组件在 beforeclose 场景下手动关闭
    close(source: ModalCloseSource = "confirm") {
      this.emitClose(source);
    },
    adjustPanelForKeyboard(keyboardHeight: number) {
      const query = this.createSelectorQuery();
      query
        .select(".common-modal__panel")
        .boundingClientRect((rect) => {
          if (!rect) {
            return;
          }

          const viewHeight = wx.getSystemInfoSync().windowHeight;
          const bottomGap = DEFAULT_KEYBOARD_OFFSET;
          const keyboardTop = viewHeight - keyboardHeight;
          // overlap > 0 代表弹窗底部被键盘遮挡，需要上移
          const overlap = rect.bottom - (keyboardTop - bottomGap);

          if (overlap <= 0) {
            this.updatePanelShift(0);
            return;
          }

          const maxShift = Math.max(0, rect.top - bottomGap);
          const shift = Math.min(overlap, maxShift);
          this.updatePanelShift(shift);
        })
        .exec();
    },
    startLeaveTimer() {
      this.clearLeaveTimer();
      const duration = DEFAULT_ANIMATION_DURATION;
      // 等离场动画结束后再彻底隐藏，避免闪断。
      (this as any)._leaveTimer = setTimeout(() => {
        this.setModalState("hidden", {
          panelShift: 0,
          keyboardHeight: 0,
        });
      }, duration);
    },
    openWithAnimation() {
      this.clearLeaveTimer();
      // entering -> shown 两段切换，确保过渡类名生效。
      this.setModalState("entering");

      wx.nextTick(() => {
        this.setModalState("shown");
      });
    },
    setModalState(phase: ModalPhase, extraData: Record<string, unknown> = {}) {
      // 统一维护 phase/visible/active，避免各处状态不一致。
      this.setData({
        phase,
        visible: phase !== "hidden",
        active: phase === "shown",
        ...extraData,
      });
    },
    scheduleKeyboardAdjust() {
      if ((this as any)._adjustPending) {
        return;
      }

      // 合并同一帧内的多次输入更新，减少重复测量布局。
      (this as any)._adjustPending = true;
      wx.nextTick(() => {
        (this as any)._adjustPending = false;
        if (this.data.keyboardHeight > 0) {
          this.adjustPanelForKeyboard(this.data.keyboardHeight);
        }
      });
    },
    updatePanelShift(nextShift: number) {
      if (Math.abs(nextShift - this.data.panelShift) < 1) {
        return;
      }

      this.setData({
        panelShift: nextShift,
      });
    },
    resetInputPosition() {
      this.setData({
        panelShift: 0,
        keyboardHeight: 0,
      });
    },
    clearLeaveTimer() {
      const timer = (this as any)._leaveTimer as
        | ReturnType<typeof setTimeout>
        | undefined;
      if (timer) {
        clearTimeout(timer);
        (this as any)._leaveTimer = null;
      }
    },
  },
});
