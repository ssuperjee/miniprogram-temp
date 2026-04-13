Page({
  data: {
    gaugeValue: 50,
  },

  onButtonTap() {
    const newValue = Math.floor(Math.random() * 101);
    this.setData({
      gaugeValue: newValue,
    });
  },
});