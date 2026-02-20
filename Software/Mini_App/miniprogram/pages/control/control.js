// pages/control/control.js - 云开发版
const app = getApp();

Page({
  data: {
    device: null,
    deviceStatus: {
      battery: 0,
      temperature: 0,
      mode: 'solid',
      online: false
    },
    lightModes: [
      { id: 'solid', name: '常亮', icon: '💡', color: '#ff4444' },
      { id: 'breath', name: '呼吸灯', icon: '🌬️', color: '#ff8844' },
      { id: 'flow', name: '流水灯', icon: '💧', color: '#44aa44' }
    ],
    selectedMode: 'solid',
    brightness: 80,
    isAntiTheft: false,
    showStatusDetail: false
  },
  
  onShow() {
    this.loadCurrentDevice();
    this.startStatusPolling();
  },
  
  onHide() {
    this.stopStatusPolling();
  },
  
  // 加载当前设备
  loadCurrentDevice() {
    const device = app.globalData.currentDevice;
    if (device) {
      this.setData({ device });
      this.getDeviceStatus();
    }
  },
  
  // 获取设备状态
  async getDeviceStatus() {
    if (!this.data.device) return;
    
    try {
      const result = await app.getDeviceStatus(this.data.device.deviceId);
      
      if (result.success) {
        this.setData({
          deviceStatus: result.data,
          selectedMode: result.data.mode,
          brightness: result.data.brightness || 80,
          isAntiTheft: result.data.antiTheft || false
        });
      }
      
    } catch (error) {
      console.error('获取设备状态失败:', error);
    }
  },
  
  // 开始状态轮询
  startStatusPolling() {
    this.statusTimer = setInterval(() => {
      this.getDeviceStatus();
    }, 5000); // 每5秒更新一次
  },
  
  // 停止状态轮询
  stopStatusPolling() {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
  },
  
  // 选择灯光模式
  async selectMode(e) {
    const modeId = e.currentTarget.dataset.mode;
    
    this.setData({ selectedMode: modeId });
    
    try {
      await app.controlDevice(
        this.data.device.deviceId,
        'set_mode',
        modeId
      );
      
      wx.showToast({
        title: '模式已切换',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('切换模式失败:', error);
    }
  },
  
  // 调整亮度
  async onBrightnessChange(e) {
    const brightness = e.detail.value;
    this.setData({ brightness });
    
    try {
      await app.controlDevice(
        this.data.device.deviceId,
        'set_brightness',
        brightness
      );
      
    } catch (error) {
      console.error('调整亮度失败:', error);
    }
  },
  
  // 切换防盗模式
  async toggleAntiTheft() {
    const newValue = !this.data.isAntiTheft;
    
    this.setData({ isAntiTheft: newValue });
    
    try {
      await app.controlDevice(
        this.data.device.deviceId,
        'antitheft',
        newValue
      );
      
      wx.showToast({
        title: newValue ? '防盗已开启' : '防盗已关闭',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('切换防盗模式失败:', error);
    }
  },
  
  // 手动触发刹车灯
  async triggerBrakeLight() {
    try {
      await app.controlDevice(
        this.data.device.deviceId,
        'brake',
        ''
      );
      
      wx.showToast({
        title: '刹车灯已触发',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('触发刹车灯失败:', error);
    }
  },
  
  // 查看设备详情
  showDeviceDetail() {
    wx.navigateTo({
      url: '/pages/device/detail?deviceId=' + this.data.device.deviceId
    });
  },
  
  // 分享设备控制
  onShareAppMessage() {
    const device = this.data.device;
    return {
      title: device ? `${device.name} - 智能自行车尾灯` : '智能自行车尾灯',
      path: `/pages/control/control?deviceId=${device.deviceId}`,
      imageUrl: '/images/share-bike-light.png'
    };
  }
});