<template>
  <div class="auto-aim-container">
    <!-- 头部区域 -->
    <div class="header">
      <div class="logo-area">
        <div class="crosshair"></div>
        <div class="logo-text">
          <h1>游戏启动系统</h1>
          <p>单机FPS · 爽快游玩 · 竞技提升</p>
        </div>
      </div>
<!--      <div class="user-area">-->
<!--        <div class="user-info">-->
<!--          <h3>玩家: {{ username }}</h3>-->
<!--          <p>当前状态: {{ autoAimStatus }}</p>-->
<!--        </div>-->
<!--      </div>-->
      <el-button class="back-button" type="primary" circle @click="goToMain">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
    </div>

    <!-- 主控制区 -->
    <div class="control-center">
      <div class="status-card">
        <div class="status-indicator" :class="{ 'active': isAutoAimEnabled }"></div>
        <h3>游戏状态</h3>
        <p>{{ isAutoAimEnabled ? '已启用' : '已禁用' }}</p>
      </div>

      <div class="switch-container">
        <el-switch
            v-model="isAutoAimEnabled"
            active-text="开启游戏"
            inactive-text="关闭游戏"
            :active-value="true"
            :inactive-value="false"
            @change="toggleAutoAim"
            size="large"
            active-color="#13ce66"
            inactive-color="#ff4949"
        >
        </el-switch>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="footer">
      <p>© 2025 FPS游戏智能系统 | 游戏启动模块</p>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, onUnmounted} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { ArrowLeft } from '@element-plus/icons-vue';

// 获取路由参数中的用户名
const route = useRoute();
const router = useRouter();
const username = ref(route.params.username || '未知用户');

// 自动瞄准状态
const isAutoAimEnabled = ref(false);
const autoAimStatus = ref('未激活');

const statusPollingTimer = ref(null);
const POLLING_INTERVAL = 3000; // 3秒轮询一次

// 轮询游戏状态的方法
const pollGameStatus = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:5000/api/game/status');
    const isRunning = response.data.running;

    // 重要：仅在后端状态变化且与前端不一致时更新
    if (!isRunning && isAutoAimEnabled.value) {
      console.log("检测到游戏已关闭，更新前端状态");
      isAutoAimEnabled.value = false;
      autoAimStatus.value = '已停用';
    }
  } catch (error) {
    console.error('轮询游戏状态失败:', error);
    // 可选：添加失败处理逻辑
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

// 切换游戏状态
const toggleAutoAim = async (newState) => {
  console.log("切换前 newState:", typeof newState);

  try {
    // 向后端发送开启/关闭指令
    const response = await axios.post('http://127.0.0.1:5000/api/game/toggle', {
      username: username.value,
      enable: newState,  // 使用用户选择的新状态
    });

    if (response.data.success) {
      // 更新本地状态为请求的新状态
      isAutoAimEnabled.value = newState;

      // 更新状态文本
      autoAimStatus.value = newState ? '运行中' : '已停用';

      // 显示正确的消息
      ElMessage.success({
        message: `自动瞄准已${newState ? '开启' : '关闭'}`,
        duration: 1500
      });

      console.log("切换成功，新状态:", newState);
    } else {
      // 请求失败时恢复之前的状态
      isAutoAimEnabled.value = !newState;
      ElMessage.error(`操作失败: ${response.data.message}`);
      console.log("切换失败，恢复状态:", !newState);
    }
  } catch (error) {
    console.error('自动瞄准控制请求失败:', error);

    // 恢复之前的状态
    isAutoAimEnabled.value = !newState;

    // 显示错误信息
    if (error.response) {
      console.error("错误详情:", error.response.data);
      ElMessage.error(`服务器错误: ${error.response.status} - ${error.response.data.detail || '未处理的错误'}`);
    } else {
      ElMessage.error('网络连接失败，请检查网络设置');
    }
  }
};

// 添加返回主页面方法
const goToMain = () => {
  router.push(`/${username.value}/main`);
};

// 初始化时检查状态
onMounted(async () => {
  try {
    // 从后端获取当前状态
    const response = await axios.get(`http://127.0.0.1:5000/api/game/status`, {
      params: {
        username: username.value // 替换为实际的用户名
      }
    });
    if (response.data.success) {
      isAutoAimEnabled.value = response.data.enabled;
      autoAimStatus.value = response.data.enabled ? '运行中' : '已停用';
    }
  } catch (error) {
    console.error('获取自动瞄准状态失败:', error);
    ElMessage.warning('无法获取当前状态，使用默认设置');
  }
  finally {
    startPolling(); // 确保无论如何都启动轮询
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.auto-aim-container {
  position: relative;
  min-height: 100vh;
  background:
      radial-gradient(circle at 20% 30%, rgba(20, 25, 45, 0.9) 0%, rgba(10, 15, 30, 0.95) 100%),
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23121825"/><path d="M0 0L100 100M100 0L0 100" stroke="%23222" stroke-width="0.3"/></svg>');
  background-size: cover;
  padding: 30px;
  color: #e0e0ff;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  display: flex;
  flex-direction: column;
}

.user-controls {
  display: flex;
  align-items: center;
  gap: 15px; /* 调整用户信息与返回按钮之间的间距 */
}

.user-area {
  margin-right: 0; /* 移除原有的右边距 */
}

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

.crosshair {
  position: relative;
  width: 50px;
  height: 50px;
  background: rgba(100, 150, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crosshair::before, .crosshair::after {
  content: '';
  position: absolute;
  background: #70a0ff;
  border-radius: 1px;
}

.crosshair::before {
  width: 100%;
  height: 3px;
  top: 50%;
  transform: translateY(-50%);
}

.crosshair::after {
  width: 3px;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.logo-text h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(to right, #a0c0ff, #70a0ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.logo-text p {
  font-size: 14px;
  color: #a0c0ff;
  letter-spacing: 1px;
  margin-top: 5px;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  text-align: right;
}

.user-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #e0e0ff;
}

.user-info p {
  font-size: 14px;
  color: #70a0ff;
  margin-top: 5px;
  font-weight: 500;
}

.control-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.status-card {
  background: rgba(25, 35, 60, 0.7);
  border-radius: 15px;
  padding: 30px 50px;
  text-align: center;
  margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
  position: relative;
  width: 100%;
}

.status-indicator {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  margin: 0 auto 20px;
  position: relative;
  border: 4px solid #ff4949;
  transition: all 0.5s ease;
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
}

.status-indicator.active {
  border-color: #13ce66;
}

.status-indicator.active::before {
  background: rgba(19, 206, 102, 0.2);
  box-shadow: 0 0 20px rgba(19, 206, 102, 0.3);
}

.status-card h3 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #e0e0ff;
}

.status-card p {
  font-size: 18px;
  color: #70a0ff;
  font-weight: 500;
}

.switch-container {
  margin: 30px 0;
  background: rgba(20, 25, 45, 0.6);
  padding: 20px 40px;
  border-radius: 30px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(100, 150, 255, 0.2);
}

.settings-panel {
  width: 100%;
  background: rgba(25, 35, 60, 0.7);
  border-radius: 15px;
  padding: 30px;
  margin: 30px 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
}

.settings-panel h3 {
  font-size: 20px;
  margin-bottom: 25px;
  color: #a0c0ff;
  text-align: center;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
}

.slider-group {
  margin-bottom: 30px;
}

.slider-item {
  margin-bottom: 25px;
}

.slider-item label {
  display: block;
  margin-bottom: 12px;
  color: #e0e0ff;
  font-size: 16px;
}

.slider-item span {
  display: block;
  text-align: center;
  margin-top: 10px;
  color: #70a0ff;
  font-weight: 500;
}

.toggle-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.toggle-group :deep(.el-checkbox) {
  margin: 5px;
}

.toggle-group :deep(.el-checkbox__label) {
  color: #e0e0ff;
}

.toggle-group :deep(.el-checkbox.is-bordered) {
  background: rgba(30, 40, 70, 0.5);
  border-color: rgba(100, 150, 255, 0.3);
}

.stats-panel {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  flex: 1;
  background: rgba(25, 35, 60, 0.7);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(64, 96, 192, 0.4);
  border-color: rgba(100, 150, 255, 0.4);
}

.stat-icon {
  font-size: 40px;
  margin-bottom: 15px;
}

.stat-card h4 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #d0d8ff;
}

.stat-card p {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(to right, #a0c0ff, #70a0ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.footer {
  text-align: center;
  padding: 30px 0 10px;
  color: #8090c0;
  font-size: 14px;
  border-top: 1px solid rgba(80, 120, 200, 0.2);
  margin-top: 30px;
}

.back-button {
  margin-right: 10px;
  background: rgba(100, 150, 255, 0.2);
  border: 1px solid rgba(100, 150, 255, 0.3);
}

.back-button:hover {
  background: rgba(100, 150, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .user-area {
    justify-content: center;
    width: 100%;
  }

  .user-info {
    text-align: center;
  }

  .stats-panel {
    flex-direction: column;
    gap: 15px;
  }

  .switch-container {
    padding: 15px 20px;
  }

  .settings-panel {
    padding: 20px;
  }

  .toggle-group {
    flex-direction: column;
    align-items: center;
  }
}
</style>