<template>
  <div class="data-view-container">
    <!-- 头部区域 -->
    <div class="header">
      <div class="logo-area">
        <div class="crosshair"></div>
        <div class="logo-text">
          <h1>游戏数据统计</h1>
          <p>详细记录 · 精准分析 · 竞技提升</p>
        </div>
      </div>

      <el-button class="back-button" type="primary" circle @click="goToMain">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
    </div>

    <!-- 数据筛选区域 -->
    <div class="filter-section">
      <div class="filter-group">
        <label>日期范围:</label>
        <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            size="large"
            @change="fetchData"
        />
      </div>

      <el-button type="primary" size="large" @click="fetchData" :loading="isLoading">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <!-- 数据概览卡片 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">🎮</div>
        <div class="stat-content">
          <h3>总场次</h3>
          <p>{{ summary.totalGames }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⏱️️</div>
        <div class="stat-content">
          <h3>平均时长</h3>
          <p>{{ summary.avgDuration }} 分钟</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <h3>平均击杀数</h3>
          <p>{{ summary.avgKills }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🧊</div>
        <div class="stat-content">
          <h3>平均立方体数</h3>
          <p>{{ summary.avgCubes }}</p>
        </div>
      </div>
    </div>

    <!-- 数据加载状态 -->
    <div v-if="isLoading && allGameData.length === 0" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <p>正在加载游戏数据...</p>
    </div>

    <!-- 无数据提示 -->
    <div v-else-if="allGameData.length === 0" class="no-data">
      <el-icon><DataBoard /></el-icon>
      <p>暂无游戏数据</p>
    </div>

    <!-- 数据表格 -->
    <div v-else class="data-table-container">
      <el-table
          :data="paginatedGameData"
          stripe
          style="width: 100%"
          v-loading="isLoading"
          element-loading-text="数据加载中..."
          @sort-change="handleSortChange"
      >
        <el-table-column prop="timestamp" label="时间" width="300" sortable="custom" />
        <el-table-column prop="scoreNum" label="分数" width="300" sortable="custom" />
        <el-table-column prop="time" label="时长" width="300" />
        <el-table-column prop="killsNum" label="击杀数" width="300" sortable="custom" />
        <el-table-column prop="cubesNum" label="立方体数" width="300" sortable="custom" />
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalRecords"
            layout="total, prev, pager, next, jumper"
            background
            @current-change="handlePageChange"
        />
      </div>
    </div>
    <!-- 页脚 -->
    <div class="footer">
      <p>© 2025 FPS游戏智能系统 | 游戏数据模块 | 更新时间: {{ lastUpdate }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import {useRoute, useRouter} from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import {ArrowLeft} from "@element-plus/icons-vue";

// 获取路由参数中的用户名
const route = useRoute();
const router = useRouter();
const username = ref(route.params.username || '未知用户');
const lastUpdate = ref('2025-06-16');

// 数据加载状态
const isLoading = ref(false);

// 筛选条件
const dateRange = ref([]);
const resultFilter = ref('all');
const autoAimFilter = ref('all');

// 分页设置
const currentPage = ref(1);
const pageSize = ref(10);
const totalRecords = ref(0);

// 存储所有游戏数据
const allGameData = ref([]);
// 当前页数据
const paginatedGameData = ref([]);

// 排序相关状态
const sortColumn = ref(null); // 当前排序列
const sortDirection = ref('asc'); // 排序方向：'asc' 或 'desc'

const goToMain = () => {
  router.push(`/${username.value}/main`);
};

// 数据概览
const summary = ref({
  totalGames: 0,
  avgDuration: 0,
  avgKills: 0,
  avgCubes: 0
});

// 更新分页数据
const updatePaginatedData = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  paginatedGameData.value = allGameData.value.slice(start, end);
};

// 计算命中率颜色
const accuracyColor = (accuracy) => {
  if (accuracy >= 70) return '#67c23a';
  if (accuracy >= 50) return '#e6a23c';
  return '#f56c6c';
};

// 查看详情
const viewDetails = (row) => {
  ElMessage.info(`查看游戏 ${row.gameId} 的详细信息`);
  // 实际应用中这里会导航到详情页面
};

// 初始化图表
let winRateChart = null;
let accuracyChart = null;

const initCharts = () => {
  // 销毁现有图表
  if (winRateChart) winRateChart.dispose();
  if (accuracyChart) accuracyChart.dispose();

  // 胜率趋势图
  winRateChart = echarts.init(document.querySelector('.charts-container .chart-card:first-child div'));
  winRateChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}%'
    },
    xAxis: {
      type: 'category',
      data: ['10/14', '10/15', '10/16', '10/17', '10/18'],
      axisLine: {
        lineStyle: {
          color: '#a0b0d0'
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      },
      axisLine: {
        lineStyle: {
          color: '#a0b0d0'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(100, 150, 255, 0.1)'
        }
      }
    },
    series: [{
      name: '胜率',
      type: 'line',
      data: [62, 58, 67, 71, 75],
      smooth: true,
      lineStyle: {
        color: '#70a0ff',
        width: 3
      },
      itemStyle: {
        color: '#70a0ff'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(112, 160, 255, 0.5)' },
          { offset: 1, color: 'rgba(112, 160, 255, 0.1)' }
        ])
      }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    }
  });

  // 命中率分布图
  accuracyChart = echarts.init(document.querySelector('.charts-container .chart-card:last-child div'));
  accuracyChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['40-50%', '50-60%', '60-70%', '70-80%', '80-90%'],
      axisLine: {
        lineStyle: {
          color: '#a0b0d0'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '场次',
      axisLine: {
        lineStyle: {
          color: '#a0b0d0'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(100, 150, 255, 0.1)'
        }
      }
    },
    series: [{
      name: '命中率分布',
      type: 'bar',
      data: [2, 3, 8, 10, 4],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    }
  });
};

// 计算数据概览
const calculateSummary = (data) => {
  const total = data.length;

  // 计算总时长（分钟）
  const totalDuration = data.reduce((sum, item) => {
    // 将时间字符串转换为分钟数
    // 格式为 "10:30" -> 10.5分钟
    const [minutes, seconds] = item.time.split(':').map(Number);
    return sum + minutes + (seconds / 60);
  }, 0);

  // 计算总击杀数
  const totalKills = data.reduce((sum, item) => sum + parseFloat(item.kills || 0), 0);

  // 计算总立方体数
  const totalCubes = data.reduce((sum, item) => sum + parseFloat(item.cubes || 0), 0);

  summary.value = {
    totalGames: total,
    avgDuration: total > 0 ? (totalDuration / total).toFixed(1) : 0,
    avgKills: total > 0 ? (totalKills / total).toFixed(1) : 0,
    avgCubes: total > 0 ? (totalCubes / total).toFixed(1) : 0
  };
};

// 处理分页变化
const handlePageChange = (newPage) => {
  currentPage.value = newPage;
  updatePaginatedData();
};

// 修改表格排序事件处理函数
const handleSortChange = ({ prop, order }) => {
  sortColumn.value = prop;
  sortDirection.value = order === 'ascending' ? 'asc' : 'desc';

  // 对整个数据集排序
  sortAllGameData();

  // 更新当前页数据
  updatePaginatedData();
};

// 对整个数据集进行排序的函数
const sortAllGameData = () => {
  if (!sortColumn.value) return;

  allGameData.value.sort((a, b) => {
    const valA = a[sortColumn.value];
    const valB = b[sortColumn.value];

    // 数字类型特殊处理
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection.value === 'asc' ? valA - valB : valB - valA;
    }

    // 字符串类型处理
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection.value === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
    }

    // 其他类型默认按原始值比较
    return sortDirection.value === 'asc'
        ? valA - valB
        : valB - valA;
  });
};

// 从后端获取数据
const fetchData = async () => {
  try {
    isLoading.value = true;

    // 构建查询参数 (不需要分页参数)
    const params = {
      username: username.value,
      page: currentPage.value,
      result: resultFilter.value !== 'all' ? resultFilter.value : undefined,
      autoAim: autoAimFilter.value !== 'all' ? (autoAimFilter.value === 'on') : undefined,
    };

    // 添加日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }

    // 调用后端API获取所有数据
    const response = await axios.get(`http://127.0.0.1:5000/api/game-data/${username.value}`, { params });
    const responseData = response.data;

    if (responseData.success) {
      // 保存所有数据
      allGameData.value = responseData.records.map(item => ({
        timestamp: item.timestamp,
        score: item.score,
        time: item.time,
        kills: item.kills,
        cubes: item.cubes,

        scoreNum: parseFloat(item.score) || 0,
        killsNum: parseFloat(item.kills) || 0,
        cubesNum: parseFloat(item.cubes) || 0
      }));

      if (dateRange.value && dateRange.value.length === 2) {
        const startDate = new Date(dateRange.value[0]);
        const endDate = new Date(dateRange.value[1]);
        endDate.setDate(endDate.getDate() + 1); // 包含结束日期的整天

        allGameData.value = allGameData.value.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= startDate && itemDate < endDate;
        });
      }

      if (sortColumn.value) {
        sortAllGameData();
      }

      // 更新总记录数
      totalRecords.value = allGameData.value.length;

      // 更新当前页数据
      updatePaginatedData();

      currentPage.value = 1;

      // 计算数据概览
      calculateSummary(allGameData.value);

      // 使用await nextTick确保DOM更新完成
      await nextTick();
      // 初始化图表
      initCharts();

      ElMessage.success('数据加载成功');
    } else {
      ElMessage.error('数据加载失败: ' + responseData.message);
    }
  } catch (error) {
    console.error('获取游戏数据失败:', error);
    // ElMessage.error('服务器连接失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 组件挂载时初始化
onMounted(() => {
  fetchData();

  // 监听窗口大小变化，重新调整图表大小
  window.addEventListener('resize', () => {
    if (winRateChart) winRateChart.resize();
    if (accuracyChart) accuracyChart.resize();
  });
});
</script>

<style scoped>
.data-view-container {
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

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a6fcb, #45aaf2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(25, 35, 60, 0.7);
  border-radius: 10px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-size: 16px;
  color: #e0e0ff;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(25, 35, 60, 0.7);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
}

.stat-icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(100, 150, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  font-size: 16px;
  color: #a0c0ff;
  margin-bottom: 5px;
}

.stat-content p {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(to right, #a0c0ff, #70a0ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.data-table-container {
  background: rgba(25, 35, 60, 0.7);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
}

:deep(.el-table) {
  background: transparent;
}

:deep(.el-table th) {
  background-color: rgba(40, 50, 80, 0.7);
  color: #a0c0ff;
  font-weight: 600;
}

:deep(.el-table tr) {
  background-color: rgba(30, 40, 70, 0.5);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: rgba(35, 45, 75, 0.5);
}

:deep(.el-table td) {
  border-bottom: 1px solid rgba(100, 150, 255, 0.1);
}

:deep(.el-table .cell) {
  color: #e0e0ff;
}

:deep(.el-progress-bar) {
  display: inline-block;
  width: 60px;
  vertical-align: middle;
  margin-right: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

:deep(.el-pagination) {
  --el-pagination-bg-color: rgba(40, 50, 80, 0.7);
  --el-pagination-button-disabled-bg-color: rgba(40, 50, 80, 0.7);
  --el-pagination-hover-color: #70a0ff;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: rgba(25, 35, 60, 0.7);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.2);
}

.chart-card h3 {
  font-size: 18px;
  color: #a0c0ff;
  margin-bottom: 15px;
  text-align: center;
}

.footer {
  text-align: center;
  padding: 30px 0 10px;
  color: #8090c0;
  font-size: 14px;
  border-top: 1px solid rgba(80, 120, 200, 0.2);
  margin-top: auto;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}

.loading-icon {
  font-size: 48px;
  margin-bottom: 20px;
  color: #70a0ff;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 无数据状态 */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
  color: #a0c0ff;
}

.no-data .el-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: #a0c0ff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .charts-container {
    grid-template-columns: 1fr;
  }
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

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .filter-group {
    width: 100%;
  }
}
</style>