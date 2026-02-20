// miniprogram/app.js
App({
  onLaunch() {
    console.log('智能自行车尾灯小程序启动');
    
    // 初始化云开发
    this.initCloud();
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 初始化全局数据
    this.initGlobalData();
  },

  onShow() {
    console.log('小程序显示');
  },

  onHide() {
    console.log('小程序隐藏');
  },

  onError(error) {
    console.error('小程序发生错误:', error);
  },

  // 初始化云开发
  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    
    wx.cloud.init({
      env: '你的云环境ID', // 替换为你的云环境ID
      traceUser: true,
    });
    
    console.log('云开发初始化完成');
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('access_token');
    
    if (userInfo && token) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      console.log('用户已登录:', userInfo);
    } else {
      console.log('用户未登录');
    }
  },

  // 初始化全局数据
  initGlobalData() {
    this.globalData = {
      // 用户信息
      userInfo: null,
      isLoggedIn: false,
      
      // 设备信息
      deviceList: [],
      currentDevice: null,
      deviceStatus: {},
      
      // 系统状态
      isConnected: false,
      isTracking: false,
      currentTrackId: null,
      
      // 配置信息
      config: {
        apiBaseUrl: 'https://api.weixin.qq.com',
        mqttServer: 'wxs://your-mqtt-server.com',
        mapKey: '你的地图密钥'
      },
      
      // 版本信息
      version: '1.0.0'
    };
  },

  // 云函数调用封装
  async callCloudFunction(name, data = {}) {
    try {
      console.log(`调用云函数: ${name}`, data);
      
      const result = await wx.cloud.callFunction({
        name: name,
        data: data
      });
      
      console.log(`云函数 ${name} 返回:`, result);
      return result.result;
      
    } catch (error) {
      console.error(`调用云函数 ${name} 失败:`, error);
      throw error;
    }
  },

  // 用户登录
  async userLogin() {
    try {
      // 获取微信登录code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });
      
      if (!loginRes.code) {
        throw new Error('获取登录code失败');
      }
      
      // 调用登录云函数
      const result = await this.callCloudFunction('login', {
        code: loginRes.code
      });
      
      if (result.success) {
        // 保存用户信息
        wx.setStorageSync('access_token', result.token);
        wx.setStorageSync('userInfo', result.userInfo);
        
        this.globalData.userInfo = result.userInfo;
        this.globalData.isLoggedIn = true;
        
        console.log('用户登录成功:', result.userInfo);
        return result;
      } else {
        throw new Error(result.message || '登录失败');
      }
      
    } catch (error) {
      console.error('用户登录失败:', error);
      throw error;
    }
  },

  // 获取设备列表
  async getDeviceList() {
    try {
      const result = await this.callCloudFunction('deviceList');
      
      if (result.success) {
        this.globalData.deviceList = result.devices || [];
        return this.globalData.deviceList;
      } else {
        throw new Error(result.message || '获取设备列表失败');
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
      return [];
    }
  },

  // 获取设备状态
  async getDeviceStatus(deviceId) {
    try {
      const result = await this.callCloudFunction('deviceStatus', {
        deviceId: deviceId
      });
      
      if (result.success) {
        // 更新全局设备状态
        this.globalData.deviceStatus = result.data;
        return result.data;
      } else {
        throw new Error(result.message || '获取设备状态失败');
      }
    } catch (error) {
      console.error('获取设备状态失败:', error);
      throw error;
    }
  },

  // 控制设备
  async controlDevice(deviceId, command, value = null) {
    try {
      const result = await this.callCloudFunction('deviceControl', {
        deviceId: deviceId,
        command: command,
        value: value
      });
      
      if (result.success) {
        console.log(`设备控制成功: ${command} = ${value}`);
        return result;
      } else {
        throw new Error(result.message || '设备控制失败');
      }
    } catch (error) {
      console.error('设备控制失败:', error);
      throw error;
    }
  },

  // 开始轨迹记录
  async startTracking(deviceId) {
    try {
      const result = await this.callCloudFunction('trackRecord', {
        action: 'start',
        deviceId: deviceId
      });
      
      if (result.success) {
        this.globalData.isTracking = true;
        this.globalData.currentTrackId = result.trackId;
        return result;
      } else {
        throw new Error(result.message || '开始轨迹记录失败');
      }
    } catch (error) {
      console.error('开始轨迹记录失败:', error);
      throw error;
    }
  },

  // 添加轨迹点
  async addTrackPoint(trackId, point) {
    try {
      const result = await this.callCloudFunction('trackRecord', {
        action: 'add_point',
        trackId: trackId,
        point: point
      });
      
      return result;
    } catch (error) {
      console.error('添加轨迹点失败:', error);
      throw error;
    }
  },

  // 结束轨迹记录
  async stopTracking() {
    try {
      if (!this.globalData.currentTrackId) {
        throw new Error('没有正在记录的轨迹');
      }
      
      const result = await this.callCloudFunction('trackRecord', {
        action: 'end',
        trackId: this.globalData.currentTrackId
      });
      
      if (result.success) {
        this.globalData.isTracking = false;
        const trackId = this.globalData.currentTrackId;
        this.globalData.currentTrackId = null;
        
        return { ...result, trackId };
      } else {
        throw new Error(result.message || '结束轨迹记录失败');
      }
    } catch (error) {
      console.error('结束轨迹记录失败:', error);
      throw error;
    }
  },

  // 绑定设备
  async bindDevice(deviceId, deviceName) {
    try {
      const result = await this.callCloudFunction('deviceBind', {
        deviceId: deviceId,
        name: deviceName
      });
      
      if (result.success) {
        // 重新加载设备列表
        await this.getDeviceList();
        return result;
      } else {
        throw new Error(result.message || '设备绑定失败');
      }
    } catch (error) {
      console.error('设备绑定失败:', error);
      throw error;
    }
  },

  // 检查OTA更新
  async checkOTAUpdate(deviceId) {
    try {
      const result = await this.callCloudFunction('otaManagement', {
        action: 'check_update',
        deviceId: deviceId
      });
      
      return result;
    } catch (error) {
      console.error('检查OTA更新失败:', error);
      throw error;
    }
  },

  // 开启防盗模式
  async enableAntiTheft(deviceId) {
    try {
      const result = await this.callCloudFunction('antiTheftAlert', {
        deviceId: deviceId,
        enable: true
      });
      
      return result;
    } catch (error) {
      console.error('开启防盗模式失败:', error);
      throw error;
    }
  },

  // 关闭防盗模式
  async disableAntiTheft(deviceId) {
    try {
      const result = await this.callCloudFunction('antiTheftAlert', {
        deviceId: deviceId,
        enable: false
      });
      
      return result;
    } catch (error) {
      console.error('关闭防盗模式失败:', error);
      throw error;
    }
  },

  // 创建车队
  async createGroup(groupName, password) {
    try {
      const result = await this.callCloudFunction('groupManagement', {
        action: 'create',
        name: groupName,
        password: password
      });
      
      return result;
    } catch (error) {
      console.error('创建车队失败:', error);
      throw error;
    }
  },

  // 加入车队
  async joinGroup(groupId, password) {
    try {
      const result = await this.callCloudFunction('groupManagement', {
        action: 'join',
        groupId: groupId,
        password: password
      });
      
      return result;
    } catch (error) {
      console.error('加入车队失败:', error);
      throw error;
    }
  },

  // 全局错误处理
  handleError(error, operation = '操作') {
    console.error(`${operation}失败:`, error);
    
    let errorMessage = '网络错误，请重试';
    
    if (error.errMsg) {
      if (error.errMsg.includes('fail auth deny')) {
        errorMessage = '请先登录';
      } else if (error.errMsg.includes('fail timeout')) {
        errorMessage = '网络超时，请检查网络连接';
      } else {
        errorMessage = error.errMsg;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    wx.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 3000
    });
    
    return errorMessage;
  }
});