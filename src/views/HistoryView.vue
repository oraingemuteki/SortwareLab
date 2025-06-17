<template>
  <div class="history-view">
    <!-- 头部区域 -->
    <div class="header">
      <div class="logo-area">
        <div class="crosshair"></div>
        <div class="logo-text">
          <h1>游戏历史回放系统</h1>
          <p>精彩瞬间 · 永恒记录 · 随时重温</p>
        </div>
      </div>
<!--      <div class="user-area">-->
<!--        <div class="user-info">-->
<!--          <h3>玩家: {{ username }}</h3>-->
<!--          <p>已存储 {{ recordings.length }} 个回放</p>-->
<!--        </div>-->
<!--      </div>-->

      <el-button class="back-button" type="primary" circle @click="goToMain">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
    </div>

    <!-- 回放控制区域 -->
    <div class="control-section">
      <div class="path-setting">
        <h3><el-icon><Folder /></el-icon> 回放存储路径</h3>
        <div class="path-input-group">
          <el-input
              v-model="storagePath"
              placeholder="请输入回放存储路径"
              class="path-input"
          >
            <template #prepend>
              <el-icon><FolderOpened /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="savePath">
            <el-icon><Check /></el-icon>
            保存路径
          </el-button>
          <el-button @click="browsePath">
            <el-icon><FolderAdd /></el-icon>
            浏览文件夹
          </el-button>
        </div>
        <div class="browser-warning" v-if="!isFileSystemSupported">
          <el-alert title="浏览器兼容提示" type="warning" show-icon>
            您的浏览器不支持文件路径选择功能，下载将使用默认路径
          </el-alert>
        </div>
        <p class="path-hint">当前路径: {{ currentPath }}</p>
      </div>

      <div class="recording-control">
        <h3><el-icon><VideoCamera /></el-icon> 录制控制</h3>
        <div class="control-buttons">
          <el-switch
              v-model="isRecordingEnabled"
              active-text="启用自动录制"
              inactive-text="禁用自动录制"
              :active-value="true"
              :inactive-value="false"
              @change="toggleRecording"
              size="large"
              active-color="#13ce66"
          >
          </el-switch>

          <el-button
              type="primary"
              :icon="isRecording ? VideoPause : VideoPlay"
              :disabled="!isRecordingEnabled"
              @click="toggleRecordingStatus"
          >
            {{ isRecording ? '停止录制' : '开始录制' }}
          </el-button>
        </div>

        <div class="recording-status">
          <div class="status-indicator" :class="{ active: isRecording }"></div>
          <span>{{ recordingStatusText }}</span>
        </div>
      </div>
    </div>

    <!-- 回放列表 -->
    <div class="recordings-section">
      <h3><el-icon><Collection /></el-icon> 历史回放记录 （{{ recordings.length }} 个回放）</h3>

      <div v-if="recordings.length === 0" class="no-recordings">
        <el-icon><DocumentDelete /></el-icon>
        <p>暂无历史回放记录</p>
      </div>

      <div v-else class="recordings-grid">
        <div
            v-for="recording in recordings"
            :key="recording.id"
            class="recording-card"
        >
          <div class="recording-thumbnail">
            <div class="thumbnail-overlay">
              <el-button
                  type="success"
                  circle
                  @click="playRecording(recording)"
              >
                <el-icon><VideoPlay /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="recording-details">
            <h4>{{ recording.title }}</h4>
            <p class="recording-date">
              <el-icon><Clock /></el-icon>
              {{ formatDate(recording.date) }}
            </p>
            <p class="recording-duration">
              <el-icon><Timer /></el-icon>
              时长: {{ Number(recording.duration).toFixed(2) }} 分钟
            </p>
            <p class="recording-map">
              <el-icon><MapLocation /></el-icon>
              地图: {{ recording.map }}
            </p>
            <div class="recording-actions">
              <el-button type="info" text @click="downloadRecording(recording)">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
<!--              <el-button type="warning" text @click="openFolder(recording)">-->
<!--                <el-icon><FolderOpened /></el-icon>-->
<!--                打开位置-->
<!--              </el-button>-->
              <el-button type="danger" text @click="deleteRecording(recording)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 播放器模态框 -->
    <el-dialog
        v-model="playerVisible"
        title="回放播放器"
        width="80%"
        top="5vh"
        :fullscreen="isFullscreen"
    >
      <div class="player-container">
        <div class="player-header">
          <h3>{{ currentRecording.title }}</h3>
          <div class="player-controls">
            <el-button type="info" circle @click="toggleFullscreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
            <el-button type="danger" circle @click="playerVisible = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="video-container">
<!--          <div class="video-placeholder">-->
<!--            <el-icon class="play-icon"><VideoPlay /></el-icon>-->
<!--            <p>正在播放: {{ currentRecording.title }}</p>-->
<!--          </div>-->
          <!-- 替换原有的video-placeholder -->
          <video
              controls
              autoplay
              :src="currentRecording.path"
              style="width: 100%; height: 100%">
          </video>
          <div class="playback-controls">
            <el-slider v-model="playbackProgress" :step="1" />
            <div class="time-display">
              <span>{{ formatTime(currentTime) }}</span>
              <span>{{ formatTime(totalTime) }}</span>
            </div>
            <div class="control-buttons">
              <el-button circle>
                <el-icon><RefreshLeft /></el-icon>
              </el-button>
              <el-button type="success" circle>
                <el-icon><VideoPlay /></el-icon>
              </el-button>
              <el-button circle>
                <el-icon><RefreshRight /></el-icon>
              </el-button>
              <el-button circle>
<!--                <el-icon><Volume /></el-icon>-->
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 页脚 -->
    <div class="footer">
      <p>© 2025 FPS游戏智能系统 | 历史回放模块 </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  Folder, FolderOpened, VideoCamera, Collection,
  Clock, Timer, MapLocation, VideoPlay,
  Check, FolderAdd, FullScreen, Close,
  RefreshLeft, RefreshRight, Delete,
  DocumentDelete, VideoPause, ArrowLeft, Download
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {useRoute, useRouter} from 'vue-router';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/history', // 后端API地址
  timeout: 10000
});

const route = useRoute();
const router = useRouter();
const username = ref(route.params.username || '游戏玩家');

// 路径设置
const storagePath = ref('');
const currentPath = ref('F:\\records');
const isPathSaved = ref(false);

const isFileSystemSupported = ref('showSaveFilePicker' in window);

// 录制控制
const isRecordingEnabled = ref(false);
const isRecording = ref(false);
const recordingStatusText = computed(() => {
  if (!isRecordingEnabled.value) return '录制功能已禁用';
  return isRecording.value ? '正在录制...' : '准备录制';
});

// 添加文件夹句柄引用
const folderHandle = ref(null);

const goToMain = () => {
  router.push(`/${username.value}/main`);
};

// 回放列表
const recordings = ref([]);

// 播放器状态
const playerVisible = ref(false);
const isFullscreen = ref(false);
const currentRecording = ref(null);
const playbackProgress = ref(30);
const currentTime = ref(125);
const totalTime = ref(412);

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 在设置路径时验证权限
const savePath = async () => {
  if (!storagePath.value) {
    ElMessage.warning('请输入存储路径');
    return;
  }

  // 尝试获取目录权限
  try {
    const handle = await window.showDirectoryPicker({
      startIn: storagePath.value
    });

    // 验证写权限
    await handle.requestPermission({ mode: 'readwrite' });

    currentPath.value = storagePath.value;
    isPathSaved.value = true;
    ElMessage.success('存储路径已更新');
  } catch (error) {
    if (error.name !== 'AbortError') {
      ElMessage.error('路径设置失败: ' + error.message);
    }
  }
};

// 浏览文件夹
const browsePath = async () => {
  if (!isFileSystemSupported.value) {
    ElMessage.info('浏览文件夹功能需要桌面应用支持');
    storagePath.value = 'F:\\records';
    return;
  }

  try {
    // 请求用户选择文件夹
    folderHandle.value = await window.showDirectoryPicker();

    // 获取文件夹路径（安全沙箱环境只能获取名称）
    const folderName = folderHandle.value.name;
    storagePath.value = folderName;
    currentPath.value = `用户选择的文件夹: ${folderName}`;

    ElMessage.success(`已选择文件夹: ${folderName}`);
  } catch (error) {
    if (error.name !== 'AbortError') {
      ElMessage.error('选择文件夹失败: ' + error.message);
    } else {
      ElMessage.info('已取消选择文件夹');
    }
  }
};

// 切换录制功能
const toggleRecording = (enabled) => {
  if (enabled) {
    ElMessage.success('自动录制功能已启用');
  } else {
    if (isRecording.value) {
      isRecording.value = false;
      ElMessage.warning('录制已停止');
    }
    ElMessage.info('自动录制功能已禁用');
  }
};

const downloadRecording = async (recording) => {
  try {
    const response = await api.get(recording.path, {
      responseType: 'blob'
    });

    // 使用已保存的文件夹句柄
    if (folderHandle.value) {
      const fileHandle = await folderHandle.value.getFileHandle(
          `record_${recording.id}.mp4`,
          { create: true }
      );
      const writable = await fileHandle.createWritable();
      await writable.write(response.data);
      await writable.close();
      ElMessage.success('文件已保存到您选择的目录');
    } else {
      ElMessage.warning('请先通过"浏览文件夹"选择下载路径');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      ElMessage.error('保存失败: ' + error.message);
    }
  }
};


// 切换录制状态
// 替换原有的toggleRecordingStatus方法
const toggleRecordingStatus = async () => {
  if (!isRecordingEnabled.value) return;

  try {
    if (isRecording.value) {
      // 停止录制
      await api.post('/record', { enable: false });
      ElMessage.success('录制已停止');
    } else {
      // 开始录制
      const response = await api.post('/record', { enable: true });
      const rid = response.data.rid;

      // 添加临时记录到列表
      recordings.value.unshift({
        id: rid,
        title: `新录制 ${formatDate(new Date())}`,
        date: new Date().toISOString(),
        duration: 0,
        map: '录制中...',
        path: `/record/${rid}`
      });

      ElMessage.success('开始录制游戏回放');
    }

    isRecording.value = !isRecording.value;
    // 刷新录制列表
    await fetchRecordings();
  } catch (error) {
    ElMessage.error('操作录制失败: ' + error.message);
  }
};

// 添加录制状态轮询
const checkRecordingStatus = async () => {
  try {
    const response = await api.get('/status');
    isRecording.value = response.data;
  } catch (error) {
    console.error('获取录制状态失败:', error);
  }
};

// 播放回放
const playRecording = (recording) => {
  currentRecording.value = {
    ...recording,
    downloadPath: `${recording.path}?download=true`
  };
  playerVisible.value = true;
};

// 打开文件夹
const openFolder = (recording) => {
  ElMessage.info(`打开文件夹: ${recording.path}`);
  // 实际应用中会调用系统API打开文件管理器
  try {
    // 尝试通过后端打开文件夹
    api.post(`/open-folder`)
        .then(() => ElMessage.success('打开文件夹请求已发送'))
        .catch(() => ElMessage.warning('无法打开文件夹'));
  } catch (e) {
    // 显示文件路径让用户手动打开
    ElMessageBox.alert(
        `文件路径: ${recording.path}\n\n请手动在文件资源管理器中打开此路径`,
        '文件位置',
        { confirmButtonText: '确定' }
    );
  }
};

// 删除回放
const deleteRecording = (recording) => {
  ElMessageBox.confirm(
      `确定要删除回放 "${recording.title}" 吗？此操作无法撤销。`,
      '删除回放',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }
  ).then(() => {
    recordings.value = recordings.value.filter(r => r.id !== recording.id);
    ElMessage.success('回放已删除');
  }).catch(() => {
    // 用户取消
  });
};

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// 添加获取录制列表的方法
const fetchRecordings = async () => {
  try {
    const response = await api.get('/records');
    recordings.value = response.data.map(rec => ({
      id: rec.rid,
      title: rec.title,
      date: `${rec.date}T${rec.time}`,
      duration: rec.duration_seconds / 60, // 秒转分钟
      map: '录制地图', // 可根据实际游戏数据调整
      path: `/record/${rec.rid}`
    }));
  } catch (error) {
    ElMessage.error('获取录制列表失败: ' + error.message);
  }
};

onMounted(async () => {
  if (!('showSaveFilePicker' in window)) {
    ElMessage.warning('您的浏览器不支持文件路径选择功能');
  }
  // 初始化当前路径
  storagePath.value = currentPath.value;
  await checkRecordingStatus();
  // setInterval(checkRecordingStatus, 5000); // 每5秒检查一次状态
  await fetchRecordings();
});
</script>

<style scoped>
.history-view {
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

.control-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.path-setting, .recording-control {
  background: rgba(25, 35, 60, 0.7);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
}

.path-setting h3, .recording-control h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  margin-bottom: 20px;
  color: #a0c0ff;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
}

.path-input-group {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.path-input {
  flex: 1;
}

.path-hint {
  font-size: 14px;
  color: #8090c0;
  padding: 10px;
  background: rgba(30, 40, 70, 0.5);
  border-radius: 6px;
  margin-top: 15px;
}

.control-buttons {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 25px;
}

.recording-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(30, 40, 70, 0.5);
  border-radius: 8px;
}

.status-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #ff4949;
  box-shadow: 0 0 8px rgba(255, 73, 73, 0.5);
  transition: all 0.3s ease;
}

.status-indicator.active {
  background-color: #13ce66;
  box-shadow: 0 0 12px rgba(19, 206, 102, 0.7);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

.recordings-section {
  flex: 1;
  background: rgba(25, 35, 60, 0.7);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
  margin-bottom: 30px;
}

.recordings-section h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  margin-bottom: 20px;
  color: #a0c0ff;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
}

.no-recordings {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #8090c0;
  text-align: center;
}

.no-recordings .el-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.recordings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

.recording-card {
  background: rgba(30, 40, 70, 0.5);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.recording-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(64, 96, 192, 0.4);
  border-color: rgba(100, 150, 255, 0.4);
}

.recording-thumbnail {
  height: 180px;
  background:
      linear-gradient(135deg, #4a6fcb, #45aaf2),
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231d2c4d"/><path d="M0 0L100 100M100 0L0 100" stroke="%23255" stroke-width="1"/></svg>');
  background-size: cover;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.recording-card:hover .thumbnail-overlay {
  opacity: 1;
}

.recording-details {
  padding: 20px;
}

.recording-details h4 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #e0e0ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recording-details p {
  font-size: 14px;
  color: #a0b0d0;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recording-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(100, 150, 255, 0.2);
}

.player-container {
  background: rgba(20, 25, 40, 0.9);
  border-radius: 10px;
  overflow: hidden;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(30, 40, 70, 0.7);
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
}

.player-header h3 {
  color: #e0e0ff;
  margin: 0;
}

.player-controls {
  display: flex;
  gap: 10px;
}

.video-container {
  position: relative;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
}

.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
      linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c),
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23161b22"/><path d="M0 0L100 100M100 0L0 100" stroke="%23222" stroke-width="0.5"/></svg>');
  background-size: cover;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.play-icon {
  font-size: 80px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20px;
}

.playback-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 15px;
  background: rgba(0, 0, 0, 0.7);
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #a0b0d0;
  margin-top: 8px;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
}

.footer {
  text-align: center;
  padding: 30px 0 10px;
  color: #8090c0;
  font-size: 14px;
  border-top: 1px solid rgba(80, 120, 200, 0.2);
  margin-top: auto;
}

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

  .control-section {
    grid-template-columns: 1fr;
  }

  .path-input-group {
    flex-direction: column;
  }
}
</style>