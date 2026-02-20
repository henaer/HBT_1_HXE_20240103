// pages/index/index.js - 云开发版
const app = getApp();

Page({
  data: {
    userInfo: null,
    deviceList: [],
    scanning: false,
    showBindModal: false,
    newDeviceId: ''
  },
  
  onLoad() {
    this.getUserInfo();
    this.loadDevices();
  },
  
  // 获取用户信息
  async getUserInfo() {
    // 获取用户信息（云开发自动获取openid）
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },
  
  // 加载设备列表（从云数据库）
  async loadDevices() {
    try {
      const db = app.getDB();
      const res = await db.collection('devices')
        .where({
          _openid: '{openid}' // 云开发会自动替换为当前用户的openid
        })
        .get();
      
      this.setData({
        deviceList: res.data
      });
      
    } catch (error) {
      console.error('加载设备失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },
  
  // 扫描并绑定设备
  async scanAndBind() {
    this.setData({ scanning: true });
    
    // 模拟扫描到设备（实际应该用蓝牙扫描）
    setTimeout(() => {
      this.setData({
        scanning: false,
        showBindModal: true,
        newDeviceId: 'bike_light_' + Date.now()
      });
    }, 2000);
  },
  
  // 绑定设备
  async bindDevice() {
    const { newDeviceId } = this.data;
    
    if (!newDeviceId) {
      wx.showToast({
        title: '请输入设备ID',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '绑定中...'
    });
    
    try {
      // 调用云函数绑定设备
      const result = await app.callCloudFunction('deviceBind', {
        deviceId: newDeviceId,
        name: '我的自行车尾灯'
      });
      
      if (result.success) {
        // 重新加载设备列表
        await this.loadDevices();
        
        this.setData({
          showBindModal: false,
          newDeviceId: ''
        });
        
        wx.showToast({
          title: '绑定成功',
          icon: 'success'
        });
        
        // 跳转到控制页
        wx.switchTab({
          url: '/pages/control/control'
        });
        
      } else {
        wx.showToast({
          title: result.message || '绑定失败',
          icon: 'error'
        });
      }
      
    } catch (error) {
      console.error('绑定设备失败:', error);
      wx.showToast({
        title: '绑定失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },
  
  // 选择设备
  selectDevice(e) {
    const deviceId = e.currentTarget.dataset.deviceId;
    const device = this.data.deviceList.find(d => d.deviceId === deviceId);
    
    if (device) {
      app.globalData.currentDevice = device;
      
      // 跳转到控制页
      wx.switchTab({
        url: '/pages/control/control'
      });
    }
  },
  
  // 获取当前位置（用于测试）
  async getCurrentLocation() {
    try {
      const res = await wx.getLocation({
        type: 'gcj02',
        altitude: true
      });
      
      console.log('当前位置:', res);
      
      wx.showToast({
        title: '定位成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('获取位置失败:', error);
      wx.showToast({
        title: '请开启位置权限',
        icon: 'error'
      });
    }
  }
});