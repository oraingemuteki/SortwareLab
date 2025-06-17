<template>
  <div class="pathfinding-container">
    <!-- 头部区域 -->
    <div class="header">
      <div class="logo-area">
        <div class="logo-icon">🗺️</div>
        <div class="logo-text">
          <h1>游戏辅助系统</h1>
          <p>智能路径规划 · 自动瞄准 · 效率优化</p>
        </div>
      </div>

      <div class="user-controls">
        <div class="user-info">
          <h3>玩家: {{ username }}</h3>
          <p>当前状态: {{ navigationStatus }}</p>
        </div>
        <el-button class="back-button" type="primary" circle @click="goToMain">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 地图展示区 -->
      <div class="map-container">
        <div class="map-title">
          <h2>🗺️ 地图导航视图</h2>
          <div class="map-actions">
            <select v-model="selectedMap" class="setting-control">
              <option v-for="map in maps" :key="map.id" :value="map.id">{{ map.name }}</option>
            </select>
          </div>
        </div>
        <div class="map-display">
          <div class="map-grid"></div>
          <div class="player"></div>
          <div class="target"></div>
          <div class="path-line" :style="pathStyle"></div>
          <div
              v-for="(obstacle, index) in obstacles"
              :key="index"
              class="obstacle"
              :style="{
                width: obstacle.width + 'px',
                height: obstacle.height + 'px',
                top: obstacle.top + 'px',
                left: obstacle.left + 'px'
              }"
          ></div>
        </div>
      </div>

      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="panel-title">
          ⚙️ 游戏辅助控制中心
        </div>

        <div class="status-card">
          <div class="status-indicator" :class="{ 'active': isNavigationEnabled }"></div>
          <h3>游戏辅助状态</h3>
          <p>{{ isNavigationEnabled ? '运行中' : '已停用' }}</p>
        </div>

        <div class="switch-container">
          <label class="toggle-switch">
            <input type="checkbox" v-model="isNavigationEnabled" @change="toggleNavigation(isNavigationEnabled)">
            <span class="slider"></span>
          </label>
          <div class="switch-label">
            {{ isNavigationEnabled ? '游戏辅助已开启' : '游戏辅助已关闭' }}
<!--            <span>{{ isNavigationEnabled ? '系统正在规划路径中' : '点击开关启用自动寻路' }}</span>-->
          </div>
        </div>

        <!-- 添加自动开启游戏选项 -->
        <div class="auto-start-container">
          <el-checkbox
              v-model="autoStartGame"
              label="是否自动开启游戏"
              border
              class="auto-start-checkbox"
              @change="saveAutoStartPreference"
          >
            自动开启游戏
          </el-checkbox>
        </div>

        <div class="settings-panel">
          <h3 class="settings-title">
            ⚙️ 寻路设置
          </h3>

          <div class="setting-item">
            <label class="setting-label">路径规划策略</label>
            <select v-model="pathStrategy" class="setting-control">
              <option value="shortest">最短路径优先</option>
              <option value="safest">最安全路径优先</option>
              <option value="balanced">平衡路径</option>
            </select>
          </div>

<!--          <div class="setting-item">-->
<!--            <label class="setting-label">寻路速度</label>-->
<!--            <input type="range" min="1" max="10" v-model="navigationSpeed" class="setting-control">-->
<!--            <div class="slider-value">-->
<!--              速度: {{ navigationSpeed }}/10-->
<!--            </div>-->
<!--          </div>-->

<!--          <div class="setting-item">-->
<!--            <label class="setting-label">避障灵敏度</label>-->
<!--            <input type="range" min="1" max="10" v-model="obstacleSensitivity" class="setting-control">-->
<!--            <div class="slider-value">-->
<!--              灵敏度: {{ obstacleSensitivity }}/10-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->

<!--        <div class="stats-grid">-->
<!--          <div class="stat-card">-->
<!--            <div class="stat-icon">⚡</div>-->
<!--            <h4>平均寻路时间</h4>-->
<!--            <p>{{ isNavigationEnabled ? '0.8s' : '&#45;&#45;' }}</p>-->
<!--          </div>-->
<!--          <div class="stat-card">-->
<!--            <div class="stat-icon">📊</div>-->
<!--            <h4>避障成功率</h4>-->
<!--            <p>{{ isNavigationEnabled ? '98.7%' : '&#45;&#45;' }}</p>-->
<!--          </div>-->
<!--          <div class="stat-card">-->
<!--            <div class="stat-icon">🔄</div>-->
<!--            <h4>路径优化率</h4>-->
<!--            <p>{{ isNavigationEnabled ? '+42%' : '&#45;&#45;' }}</p>-->
<!--          </div>-->
<!--          <div class="stat-card">-->
<!--            <div class="stat-icon">🏃</div>-->
<!--            <h4>移动效率提升</h4>-->
<!--            <p>{{ isNavigationEnabled ? '+35%' : '&#45;&#45;' }}</p>-->
<!--          </div>-->
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="footer">
      <p>© 2025 FPS游戏智能系统 | 智能寻路模块 | 最后更新: {{ lastUpdate }}</p>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, onUnmounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from "@element-plus/icons-vue";
import axios from "axios";
import {ElMessage} from "element-plus";

// 获取路由信息
const route = useRoute()
const router = useRouter()

// 响应式数据
const username = ref(route.params.username || '游戏玩家')
const isNavigationEnabled = ref(false)
const navigationStatus = ref("未激活")
const pathStrategy = ref("balanced")
const selectedMap = ref("desert")
const lastUpdate = ref("2025-06-16")

// 添加自动开启游戏的响应式变量
const autoStartGame = ref(true);

const statusPollingTimer = ref(null);
const POLLING_INTERVAL = 3000; // 3秒轮询一次

const maps = ref([
  { id: "default", name: "默认地图" }
])

const obstacles = ref([
  { width: 120, height: 80, top: 100, left: 250 },
  { width: 100, height: 180, top: 220, left: 450 },
  { width: 180, height: 60, top: 300, left: 150 }
])

// 计算属性
const pathStyle = computed(() => {
  if (!isNavigationEnabled.value) {
    return {
      display: 'none'
    };
  }

  const startX = 20;
  const startY = 50;
  const endX = 80;
  const endY = 30;

  // 计算路径长度和角度
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

  return {
    width: `${length}%`,
    top: `${startY}%`,
    left: `${startX}%`,
    transform: `rotate(${angle}deg)`,
    display: 'block'
  };
})

// 轮询游戏状态的方法
const pollGameStatus = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:5000/api/game/status');
    const isRunning = response.data.running;

    // 只有当辅助功能已启用时才更新状态
    if (isRunning && isNavigationEnabled.value) {
      navigationStatus.value = '运行中';
    } else if (!isRunning && isNavigationEnabled.value) {
      console.log("检测到游戏已关闭，更新辅助状态");
      isNavigationEnabled.value = false;
      navigationStatus.value = '未激活';
    }
  } catch (error) {
    console.error('轮询游戏状态失败:', error);
  }
};

// 启动轮询
const startPolling = () => {
  // 清除现有定时器避免重复
  if (statusPollingTimer.value) clearInterval(statusPollingTimer.value);

  statusPollingTimer.value = setInterval(() => {
    pollGameStatus();
  }, POLLING_INTERVAL);
};

// 停止轮询
const stopPolling = () => {
  if (statusPollingTimer.value) {
    clearInterval(statusPollingTimer.value);
    statusPollingTimer.value = null;
  }
};

// 方法
const goToMain = () => {
  router.push(`/${username.value}/main`)
}

// 保存自动开启游戏选项到本地存储
const saveAutoStartPreference = () => {
  localStorage.setItem('autoStartGame', autoStartGame.value.toString());
};

const toggleNavigation = async (newState) => {
  try {
    if (newState && autoStartGame.value) {
      await startGame();
    }

    const response = await axios.post('http://127.0.0.1:5000/api/gamesupport/toggle', {
      username: username.value,
      enable: newState,
    });

    if (response.data.success) {
      isNavigationEnabled.value = newState;
      // 根据新状态更新导航状态
      navigationStatus.value = newState ? '启动中...' : '已停用';

      // 成功开启后更新状态
      if (newState) {
        setTimeout(() => {
          navigationStatus.value = '运行中';
        }, 1500);
      }

      ElMessage.success({
        message: `路径规划已${newState ? '开启' : '关闭'}`,
        duration: 1500
      });
    } else {
      isNavigationEnabled.value = !newState;
      navigationStatus.value = '未激活';
      ElMessage.error(`操作失败: ${response.data.message}`);
    }
  } catch (error) {
    console.error('游戏辅助控制请求失败:', error);
    isNavigationEnabled.value = !newState;
    navigationStatus.value = '未激活';

    if (error.response) {
      ElMessage.error(`服务器错误: ${error.response.status}`);
    } else {
      ElMessage.error('网络连接失败');
    }
  }
};

// 启动游戏的方法
const startGame = async () => {
  try {
    const response = await axios.post('http://127.0.0.1:5000/api/game/toggle', {
      username: username.value,
      enable: true,
    });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    console.log("游戏已自动启动");
  } catch (error) {
    console.error('启动游戏失败:', error);
    ElMessage.error('自动启动游戏失败: ' + (error.message || '未知错误'));
    throw error; // 抛出错误，让上层处理
  }
};

// 初始化时检查状态
onMounted(async () => {
  try {
    // 加载自动开启游戏选项
    const savedPreference = localStorage.getItem('autoStartGame');
    if (savedPreference !== null) {
      autoStartGame.value = savedPreference === 'true';
    }
    // 从后端获取当前状态
    const response = await axios.get(`http://127.0.0.1:5000/api/gamesupport/status`, {
      params: {
        username: username.value // 替换为实际的用户名
      }
    });
    if (response.data.success) {
      isNavigationEnabled.value = response.data.enabled;
      navigationStatus.value = response.data.enabled ? '运行中' : '已停用';
    }
  } catch (error) {
    console.error('获取游戏状态失败:', error);
    ElMessage.warning('无法获取当前状态，使用默认设置');
  }  finally {
    startPolling(); // 确保无论如何都启动轮询
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

.pathfinding-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  padding: 30px;
  display: flex;
  flex-direction: column;
  background:
      radial-gradient(circle at 20% 30%, rgba(20, 25, 45, 0.9) 0%, rgba(10, 15, 30, 0.95) 100%),
      linear-gradient(to bottom, #0f1420, #0a0e17);
  background-size: cover;
  color: #e0e7ff;
}

/* 头部导航 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(80, 120, 200, 0.3);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-icon {
  font-size: 32px;
  color: #45aaf2;
}

.logo-text h1 {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(to right, #a0c0ff, #70a0ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 1px;
}

.logo-text p {
  font-size: 14px;
  color: #a0b0d0;
  letter-spacing: 1px;
  margin-top: 4px;
}

.user-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  text-align: right;
}

.user-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #e0e7ff;
}

.user-info p {
  font-size: 13px;
  color: #8090c0;
  margin-top: 3px;
}

.back-button {
  background: rgba(100, 150, 255, 0.2);
  border: 1px solid rgba(100, 150, 255, 0.3);
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(100, 150, 255, 0.3);
  transform: translateX(-3px);
}

/* 主内容区 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  margin-bottom: 40px;
  flex: 1;
}

@media (max-width: 900px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

.map-container {
  background: rgba(25, 35, 60, 0.7);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.map-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
}

.map-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #e0e0ff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.map-display {
  height: 400px;
  background: rgba(10, 15, 30, 0.6);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.map-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
      linear-gradient(rgba(80, 100, 180, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(80, 100, 180, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.player {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #0acf83;
  border-radius: 50%;
  border: 2px solid white;
  top: 50%;
  left: 20%;
  transform: translate(-50%, -50%);
  z-index: 10;
  box-shadow: 0 0 10px #0acf83;
}

.target {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #ff6b6b;
  border-radius: 50%;
  border: 2px solid white;
  top: 30%;
  left: 80%;
  transform: translate(-50%, -50%);
  z-index: 10;
  box-shadow: 0 0 10px #ff6b6b;
}

.path-line {
  position: absolute;
  height: 4px;
  background: #45aaf2;
  transform-origin: left center;
  z-index: 5;
  box-shadow: 0 0 5px #45aaf2;
}

.obstacle {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.control-panel {
  background: rgba(25, 35, 60, 0.7);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 25px;
  color: #e0e0ff;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
}

.status-card {
  background: rgba(25, 35, 60, 0.7);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(100, 150, 255, 0.2);
}

.status-indicator {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  margin: 0 auto 20px;
  position: relative;
  border: 4px solid #ff4949;
  transition: all 0.5s ease;
}

.status-indicator.active {
  border-color: #13ce66;
}

.status-indicator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  border-radius: 50%;
  background: rgba(255, 73, 73, 0.2);
  box-shadow: 0 0 20px rgba(255, 73, 73, 0.3);
  transition: all 0.5s ease;
}

.status-indicator.active::before {
  background: rgba(19, 206, 102, 0.2);
  box-shadow: 0 0 20px rgba(19, 206, 102, 0.3);
}

.status-card h3 {
  font-size: 22px;
  margin-bottom: 10px;
  color: #e0e0ff;
}

.status-card p {
  font-size: 18px;
  color: #70a0ff;
  font-weight: 500;
}

.switch-container {
  background: rgba(20, 25, 45, 0.6);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(100, 150, 255, 0.2);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 80px;
  height: 40px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ff4949;
  transition: .4s;
  border-radius: 40px;
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

.slider:before {
  position: absolute;
  content: "";
  height: 32px;
  width: 32px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #13ce66;
  box-shadow: 0 0 10px rgba(19, 206, 102, 0.5);
}

input:checked + .slider:before {
  transform: translateX(40px);
}

.switch-label {
  margin-left: 20px;
  font-size: 18px;
  font-weight: 500;
  color: #e0e0ff;
  display: flex;
  flex-direction: column;
}

.switch-label span {
  font-size: 14px;
  color: #a0b0d0;
  margin-top: 5px;
}

.settings-panel {
  margin-top: 30px;
}

.settings-title {
  font-size: 18px;
  margin-bottom: 20px;
  color: #e0e0ff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  margin-bottom: 10px;
  color: #e0e0ff;
  font-weight: 500;
}

.setting-control {
  width: 100%;
  height: 40px;
  background: rgba(20, 25, 45, 0.6);
  border: 1px solid rgba(100, 150, 255, 0.3);
  border-radius: 8px;
  padding: 0 15px;
  color: #e0e0ff;
  font-size: 16px;
}

.slider-value {
  text-align: center;
  margin-top: 5px;
  color: #a0b0d0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 30px;
}

.stat-card {
  background: rgba(25, 35, 60, 0.7);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(100, 150, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(64, 96, 192, 0.3);
  border-color: #70a0ff;
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 15px;
  color: #70a0ff;
}

.stat-card h4 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #d0d8ff;
}

.stat-card p {
  font-size: 24px;
  font-weight: 700;
  color: #70a0ff;
}

/* 页脚 */
.footer {
  text-align: center;
  padding: 30px 0 10px;
  color: #8090c0;
  font-size: 14px;
  border-top: 1px solid rgba(80, 120, 200, 0.2);
  margin-top: auto;
}

.auto-start-container {
  margin-top: 20px;
  padding: 15px;
  background: rgba(20, 25, 45, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(100, 150, 255, 0.3);
}

.auto-start-checkbox {
  width: 100%;
  padding: 10px;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .user-controls {
    width: 100%;
    justify-content: center;
  }

  .user-info {
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .switch-container {
    flex-direction: column;
    gap: 15px;
  }

  .switch-label {
    margin-left: 0;
    text-align: center;
  }

  .user-controls {
    flex-direction: column;
    gap: 15px;
  }
}
</style>