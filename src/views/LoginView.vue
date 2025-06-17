<template>
  <div class="login-page">
    <!-- 游戏主题背景 -->
    <div class="background-overlay"></div>
    <div class="particles">
      <div v-for="i in 30" :key="i" class="particle"></div>
    </div>

    <!-- 登录/注册表单容器 -->
    <div class="login-container">
      <!-- 游戏主题头部 -->
      <div class="game-header">
        <div class="game-logo">
          <div class="crosshair"></div>
          <div class="weapon-icon">🔫</div>
          <h1>FPS游戏智能系统</h1>
        </div>
        <p class="game-tagline">精准分析 · 战术优化 · 竞技提升</p>
      </div>

      <!-- 表单切换标签 -->
      <div class="form-tabs">
        <div
            class="tab-item"
            :class="{ 'active': currentTab === 'login' }"
            @click="currentTab = 'login'"
        >
          登录
        </div>
        <div
            class="tab-item"
            :class="{ 'active': currentTab === 'register' }"
            @click="currentTab = 'register'"
        >
          注册
        </div>
      </div>

      <!-- 登录表单 -->
      <div class="login-form" v-show="currentTab === 'login'">
        <el-form :model="form" label-position="top">
          <el-form-item label="用户名">
            <el-input
                v-model="username"
                placeholder="请输入游戏ID或账号"
                clearable
                class="input-item"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="密码">
            <el-input
                v-model="password"
                type="password"
                placeholder="请输入密码"
                show-password
                class="input-item"
                @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

<!--          <el-form-item label="登录身份" class="role-selector">-->
<!--            <el-radio-group v-model="radio">-->
<!--              <el-radio :value="3" size="large" border>管理员</el-radio>-->
<!--              <el-radio :value="6" size="large" border>玩家</el-radio>-->
<!--            </el-radio-group>-->
<!--          </el-form-item>-->

          <el-button
              type="primary"
              @click="handleLogin"
              class="login-btn"
              :loading="isLoading"
          >
            {{ isLoading ? '登录中...' : '进入游戏系统' }}
          </el-button>
        </el-form>

        <div class="login-footer">
          <div class="quick-links">
            <a href="#" @click.prevent="currentTab = 'register'">注册新账号</a>
<!--            <a href="#">忘记密码?</a>-->
<!--            <a href="#">联系管理员</a>-->
          </div>
          <div class="stats-info">
            <div class="stat-item">
              <el-icon><User /></el-icon>
              <span>今日登录: 人</span>
            </div>
            <div class="stat-item">
              <el-icon><Trophy /></el-icon>
              <span>在线玩家: 人</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 注册表单 -->
      <div class="register-form" v-show="currentTab === 'register'">
        <el-form :model="registerForm" label-position="top">
          <el-form-item label="用户名" :rules="[
            { required: true, message: '请输入用户名', trigger: 'blur' },
            { min: 3, max: 20, message: '用户名长度在3-20个字符之间', trigger: 'blur' }
          ]">
            <el-input
                v-model="registerUsername"
                placeholder="请输入游戏ID或账号"
                clearable
                class="input-item"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="密码" :rules="[
            { required: true, message: '请输入密码', trigger: 'blur' },
            { min: 6, message: '密码长度至少6位', trigger: 'blur' }
          ]">
            <el-input
                v-model="registerPassword"
                type="password"
                placeholder="请输入密码"
                show-password
                class="input-item"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="确认密码" :rules="[
            { required: true, message: '请确认密码', trigger: 'blur' },
            { validator: validatePassword, trigger: 'blur' }
          ]">
            <el-input
                v-model="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                show-password
                class="input-item"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="用户角色" class="role-selector">
            <el-radio-group v-model="registerRole">
              <el-radio :value="6" size="large" border>玩家</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-button
              type="primary"
              @click="handleRegister"
              class="register-btn"
              :loading="isRegistering"
          >
            {{ isRegistering ? '注册中...' : '创建账号' }}
          </el-button>
        </el-form>

        <div class="register-footer">
          <div class="quick-links">
            <a href="#" @click.prevent="currentTab = 'login'">已有账号? 登录</a>
<!--            <a href="#">忘记密码?</a>-->
<!--            <a href="#">联系管理员</a>-->
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏元素装饰 -->
    <div class="game-elements">
      <div class="weapon weapon-1">🔫</div>
      <div class="weapon weapon-2">🔫</div>
      <div class="bullet-holes">
        <div class="hole"></div>
        <div class="hole"></div>
        <div class="hole"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router';
import axios from 'axios'
import { ElMessage, ElNotification, ElForm } from 'element-plus';

const router = useRouter()

// 登录相关数据
const username = ref('')
const password = ref('')
const radio = ref(6) // 默认选择玩家角色
const isLoading = ref(false)

// 注册相关数据
const registerUsername = ref('')
const registerPassword = ref('')
const confirmPassword = ref('')
const registerRole = ref(6) // 注册默认为玩家角色
const isRegistering = ref(false)

// 当前显示的表单（登录或注册）
const currentTab = ref('login')

// 表单验证
const validatePassword = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请确认密码'));
  } else if (value !== registerPassword.value) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

// 登录处理
function handleLogin() {
  if (!username.value || !password.value) {
    ElMessage.error('用户名和密码不能为空！');
    return;
  }

  isLoading.value = true;

  let data = {
    username: username.value,
    password: password.value
  }

  const handleSuccess = (res: any) => {
    if (res.data.code == 200) {
      sessionStorage.setItem("username", data.username);
      ElNotification.success({
        title: '登录成功',
        message: `欢迎回来，${username.value}！`,
        duration: 2000,
        offset: 70
      });

      // 在登录成功的处理逻辑中添加（通常在handleLogin方法中）
      const loginTime = new Date();
      // 格式化为"YYYY-MM-DD HH:mm"的字符串
      const formattedTime = `${loginTime.getFullYear()}-${(loginTime.getMonth()+1).toString().padStart(2, '0')}-
      ${loginTime.getDate().toString().padStart(2, '0')} ${loginTime.getHours().toString().padStart(2, '0')}:${loginTime.getMinutes().toString().padStart(2, '0')}`;
      // 存入sessionStorage
      sessionStorage.setItem('loginTime', formattedTime);

      // 路由跳转
      setTimeout(() => {
        router.push(`/${username.value}/main`);
      }, 800);
    } else {
      ElMessage.error('登录失败：' + (res.data.message || '用户名或密码错误'));
    }
    isLoading.value = false;
  }

  const handleError = (err: any) => {
    console.error(err);
    ElMessage.error('登录请求失败：' + (err.response?.data?.message || '服务器错误'));
    isLoading.value = false;
  }

  axios.post("http://127.0.0.1:5000/api/login/login", data)
        .then(handleSuccess)
        .catch(handleError);
}

// 注册处理
function handleRegister() {
  // 表单验证
  if (!registerUsername.value || !registerPassword.value || !confirmPassword.value) {
    ElMessage.error('请填写所有必填字段！');
    return;
  }

  if (registerPassword.value !== confirmPassword.value) {
    ElMessage.error('两次输入的密码不一致！');
    return;
  }

  isRegistering.value = true;

  const handleSuccess = (res: any) => {
    if (res.data.code == 200) {
      ElNotification.success({
        title: '注册成功',
        message: '您的账号已创建成功，请登录！',
        duration: 2000,
        offset: 70
      });

      // 注册成功后自动切换到登录页面
      setTimeout(() => {
        currentTab.value = 'login';
        // 清空注册表单
        registerUsername.value = '';
        registerPassword.value = '';
        confirmPassword.value = '';
      }, 1500);
    } else {
      ElMessage.error('注册失败：' + (res.data.message || '服务器错误'));
    }
    isRegistering.value = false;
  }

  const handleError = (err: any) => {
    console.error(err);
    ElMessage.error('注册请求失败：' + (err.response?.data?.message || '服务器错误'));
    isRegistering.value = false;
  }

  // 发送注册请求
  axios.post("http://127.0.0.1:5000/api/login/register", {
    username: registerUsername.value,
    password: registerPassword.value,
  })
      .then(handleSuccess)
      .catch(handleError);
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background:
      radial-gradient(circle at 20% 30%, rgba(30, 30, 50, 0.8) 0%, rgba(10, 10, 20, 0.9) 100%),
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23161b22"/><path d="M0 0L100 100M100 0L0 100" stroke="%23222" stroke-width="0.5"/></svg>');
  background-size: cover;
  padding: 20px;
  overflow: hidden;
  color: #e0e0ff;
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(40, 10, 60, 0.7) 0%, rgba(10, 30, 70, 0.7) 100%);
  z-index: 0;
}

.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.particle {
  position: absolute;
  background-color: rgba(100, 150, 255, 0.4);
  border-radius: 50%;
  animation: float 15s infinite linear;
}

@keyframes float {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) translateX(50px);
    opacity: 0;
  }
}

.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 460px;
  background: rgba(20, 25, 40, 0.85);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5),
  0 0 0 1px rgba(80, 120, 200, 0.2);
  backdrop-filter: blur(5px);
  overflow: hidden;
}

.game-header {
  text-align: center;
  padding: 30px 20px 20px;
  border-bottom: 1px solid rgba(80, 120, 200, 0.3);
  background: linear-gradient(to bottom, rgba(40, 60, 120, 0.4), transparent);
}

.game-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.game-logo h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(to right, #a0c0ff, #70a0ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.weapon-icon {
  font-size: 32px;
  transform: rotate(-15deg);
}

.crosshair {
  position: relative;
  width: 30px;
  height: 30px;
}

.crosshair::before, .crosshair::after {
  content: '';
  position: absolute;
  background: #70a0ff;
  border-radius: 2px;
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

.game-tagline {
  font-size: 14px;
  color: #a0c0ff;
  letter-spacing: 1px;
  margin-top: 5px;
}

/* 表单切换标签 */
.form-tabs {
  display: flex;
  margin: 0 30px;
  border-bottom: 1px solid rgba(80, 120, 200, 0.3);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 15px 0;
  cursor: pointer;
  font-weight: 500;
  color: #a0c0ff;
  transition: all 0.3s;
  position: relative;
}

.tab-item.active {
  color: #70a0ff;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #70a0ff;
}

.tab-item:hover {
  color: #70a0ff;
}

.login-form, .register-form {
  padding: 30px;
}

.input-item {
  margin-bottom: 25px;
}

.input-item :deep(.el-input__wrapper) {
  background: rgba(30, 35, 50, 0.7);
  border: 1px solid rgba(80, 120, 200, 0.3);
  box-shadow: none;
}

.input-item :deep(.el-input__wrapper:hover) {
  border-color: rgba(100, 150, 255, 0.6);
}

.input-item :deep(.el-input__wrapper.is-focus) {
  border-color: #70a0ff;
  box-shadow: 0 0 0 1px #70a0ff;
}

.input-item :deep(.el-input__inner) {
  color: #e0e0ff;
}

.input-item :deep(.el-input__prefix) {
  color: #70a0ff;
  padding-right: 10px;
}

.role-selector {
  margin-bottom: 25px;
}

.role-selector :deep(.el-radio) {
  margin-right: 10px;
}

.role-selector :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #70a0ff;
}

.role-selector :deep(.el-radio__input.is-checked .el-radio__inner) {
  background: #70a0ff;
  border-color: #70a0ff;
}

.role-selector :deep(.el-radio.is-bordered) {
  background: rgba(30, 35, 50, 0.7);
  border-color: rgba(80, 120, 200, 0.3);
  color: #a0c0ff;
}

.role-selector :deep(.el-radio.is-bordered.is-checked) {
  border-color: #70a0ff;
  background: rgba(80, 120, 200, 0.15);
}

.login-btn, .register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(to right, #4060c0, #6080e0);
  border: none;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.login-btn:hover, .register-btn:hover {
  background: linear-gradient(to right, #5070d0, #7090f0);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(64, 96, 192, 0.4);
}

.login-btn:active, .register-btn:active {
  transform: translateY(1px);
}

.login-footer, .register-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(80, 120, 200, 0.2);
}

.quick-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.quick-links a {
  color: #a0c0ff;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.2s;
}

.quick-links a:hover {
  color: #70a0ff;
  text-decoration: underline;
}

.stats-info {
  display: flex;
  justify-content: space-around;
  font-size: 13px;
  color: #8090c0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item .el-icon {
  font-size: 14px;
}

.game-elements {
  position: absolute;
  z-index: 5;
}

.weapon {
  position: absolute;
  font-size: 40px;
  opacity: 0.1;
}

.weapon-1 {
  top: 20%;
  left: 10%;
  transform: rotate(-20deg);
}

.weapon-2 {
  bottom: 20%;
  right: 10%;
  transform: rotate(15deg);
}

.bullet-holes {
  position: absolute;
  bottom: 15%;
  left: 15%;
}

.hole {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(120, 30, 30, 0.5);
  position: absolute;
}

.hole:nth-child(1) { left: 0; top: 0; }
.hole:nth-child(2) { left: 15px; top: 10px; }
.hole:nth-child(3) { left: 30px; top: -5px; }
</style>
