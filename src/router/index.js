import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import MainView from "@/views/MainView.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/:username/main',
            name: 'MainView',
            component: () => import('../views/MainView.vue'),
            props: true // 允许将路由参数作为 props 传递
        },
        {
            path: '/:username/gamestart',
            name: 'GameStart',
            component: () => import('../views/GameStartView.vue'),
            props: true
        },
        {
            path: '/:username/gamesupport',
            name: 'GameSupportView',
            component: () => import('../views/GameSupportView.vue'),
            props: true
        },
        {
            path: '/:username/data',
            name: 'DataView',
            component: () => import('../views/DataView.vue'),
            props: true
        },
        {
            path: '/:username/history',
            name: 'HistoryView',
            component: () => import('../views/HistoryView.vue'),
            props: true
        },
    ]
})

/* 默认跳转页面 */
// router.beforeEach((to, from, next)=>{
//     if(to.path == '/login'){
//         next()
//     }else{
//         const username = sessionStorage.getItem("username")
//         if(username == null){
//             next('/login')
//         }else{
//             next()
//         }
//     }
// })

export default router