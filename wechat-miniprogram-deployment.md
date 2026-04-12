# 微信小程序部署指南

## 目录
1. [前期准备](#1-前期准备)
2. [开发环境配置](#2-开发环境配置)
3. [代码开发](#3-代码开发)
4. [测试与调试](#4-测试与调试)
5. [服务器部署](#5-服务器部署)
6. [小程序上线](#6-小程序上线)
7. [常见问题解决](#7-常见问题解决)

---

## 1. 前期准备

### 1.1 注册微信小程序账号
1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 点击「立即注册」，选择「小程序」
3. 填写账号信息并完成邮箱验证
4. 填写主体信息（个人或企业）
5. 完成账号信息登记

### 1.2 获取AppID
1. 登录微信公众平台
2. 进入「开发」->「开发管理」->「开发设置」
3. 记录 AppID（注意：AppID 是小程序的唯一标识，非常重要）

### 1.3 配置服务器域名
1. 在微信公众平台，进入「开发」->「开发管理」->「开发设置」
2. 在「服务器域名」区域配置以下域名：
   - request 合法域名：`https://your-api-domain.com`
   - uploadFile 合法域名：`https://your-api-domain.com`
   - downloadFile 合法域名：`https://your-api-domain.com`

**注意**：
- 域名必须是 https 协议
- 域名必须备案（中国大陆服务器）
- 每个月只能修改 5 次域名配置

---

## 2. 开发环境配置

### 2.1 下载微信开发者工具
1. 访问 [微信开发者工具下载页面](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 根据您的操作系统选择对应的版本下载
3. 安装并启动微信开发者工具

### 2.2 导入项目
1. 打开微信开发者工具
2. 选择「小程序」->「导入项目」
3. 填写项目信息：
   - 项目目录：选择 frontend 文件夹
   - AppID：填写您的小程序 AppID
   - 项目名称：学校抢票小程序
4. 点击「导入」

### 2.3 配置项目
1. 在微信开发者工具中，点击右上角「详情」
2. 在「本地设置」中：
   - 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」（开发阶段使用）
3. 在「项目设置」中：
   - 检查项目名称和 AppID 是否正确

---

## 3. 代码开发

### 3.1 项目结构
```
frontend/
├── app.js              # 小程序逻辑
├── app.json            # 小程序配置
├── app.wxss            # 小程序样式
├── pages/              # 页面文件夹
│   ├── index/          # 首页
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── activity/       # 活动详情页
│   │   ├── activity.js
│   │   ├── activity.json
│   │   ├── activity.wxml
│   │   └── activity.wxss
│   └── ticket/         # 票根页
│       ├── ticket.js
│       ├── ticket.json
│       ├── ticket.wxml
│       └── ticket.wxss
└── sitemap.json        # 站点地图
```

### 3.2 修改API地址
打开 [frontend/pages/index/index.js](file:///workspace/frontend/pages/index/index.js)、[frontend/pages/activity/activity.js](file:///workspace/frontend/pages/activity/activity.js) 和 [frontend/pages/ticket/ticket.js](file:///workspace/frontend/pages/ticket/ticket.js)，将 API 地址修改为您的实际域名：

```javascript
// 开发环境
wx.request({
  url: 'http://localhost:3000/activities',
  // ...
});

// 生产环境
wx.request({
  url: 'https://your-api-domain.com/activities',
  // ...
});
```

**建议**：创建一个配置文件统一管理 API 地址：

```javascript
// frontend/config.js
const config = {
  // 开发环境
  development: {
    apiBaseUrl: 'http://localhost:3000'
  },
  // 生产环境
  production: {
    apiBaseUrl: 'https://your-api-domain.com'
  }
};

// 根据环境选择配置
const currentEnv = 'development'; // 开发时使用 development，上线时使用 production
module.exports = config[currentEnv];
```

然后在页面中使用：
```javascript
const config = require('../../config.js');

wx.request({
  url: `${config.apiBaseUrl}/activities`,
  // ...
});
```

---

## 4. 测试与调试

### 4.1 开发者工具预览
1. 在微信开发者工具中，确保后端服务正在运行
2. 点击「编译」按钮
3. 在模拟器中查看效果
4. 点击「预览」按钮，使用微信扫码在手机上预览

### 4.2 真机调试
1. 点击微信开发者工具的「真机调试」按钮
2. 使用微信扫码在手机上打开调试界面
3. 在手机上操作小程序
4. 在开发者工具中查看调试信息和日志

### 4.3 功能测试清单
- [ ] 活动列表正常加载
- [ ] 活动详情正常显示
- [ ] 抢票功能正常
- [ ] 票根正常生成和显示
- [ ] 网络请求正常
- [ ] 错误提示正常
- [ ] 页面跳转正常
- [ ] 加载状态正常

---

## 5. 服务器部署

### 5.1 后端服务部署
1. 准备服务器（推荐使用云服务器，如阿里云、腾讯云等）
2. 安装 Node.js、PostgreSQL、Redis、RabbitMQ
3. 配置服务器环境变量
4. 上传后端代码到服务器
5. 安装依赖并启动服务

详细部署步骤请参考 [deployment-guide.md](file:///workspace/deployment-guide.md)。

### 5.2 配置 HTTPS
1. 购买或申请 SSL 证书（Let's Encrypt 提供免费证书）
2. 在服务器上配置 SSL 证书
3. 使用 Nginx 或其他反向代理服务器配置 HTTPS

**Nginx 配置示例**：
```nginx
server {
    listen 443 ssl;
    server_name your-api-domain.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.3 配置 CORS
确保后端服务允许来自小程序的跨域请求。在 Nest.js 中，可以使用 `@nestjs/cors` 模块：

```bash
npm install @nestjs/cors
```

然后在 [backend/src/app.module.ts](file:///workspace/backend/src/app.module.ts) 中配置：
```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  // ...
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

---

## 6. 小程序上线

### 6.1 代码上传
1. 在微信开发者工具中，确认所有功能正常
2. 点击「上传」按钮
3. 填写版本号（如 1.0.0）和项目备注
4. 点击「上传」
5. 等待上传完成

### 6.2 提交审核
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「管理」->「版本管理」
3. 在「开发版本」中找到刚才上传的版本
4. 点击「提交审核」
5. 填写审核信息：
   - 功能页面：选择主要功能页面
   - 功能描述：简要描述小程序的功能
   - 服务类目：选择合适的类目（如「工具」->「效率」）
6. 提交审核

### 6.3 审核通过后发布
1. 审核通过后，在「版本管理」中可以看到「审核通过」的版本
2. 点击「发布」按钮
3. 确认发布信息
4. 点击「确定」发布
5. 发布成功后，用户就可以在微信中搜索到您的小程序了

---

## 7. 常见问题解决

### 7.1 网络请求失败
**问题**：在手机上无法访问 API
**解决方法**：
1. 检查服务器域名是否配置正确
2. 确认使用 HTTPS 协议
3. 检查 SSL 证书是否有效
4. 在开发阶段可以勾选「不校验合法域名」

### 7.2 审核被拒绝
**常见原因**：
1. 功能描述不清晰
2. 缺少必要的内容
3. 服务类目选择不正确
4. 涉及敏感内容

**解决方法**：
1. 仔细阅读审核拒绝原因
2. 修改相应内容
3. 重新提交审核

### 7.3 支付功能（如需）
如果您的小程序需要支付功能，需要额外配置：
1. 注册微信支付商户号
2. 在微信公众平台关联商户号
3. 配置支付回调地址
4. 实现支付逻辑

### 7.4 性能优化
- 启用代码分包加载
- 压缩图片资源
- 使用缓存
- 优化网络请求
- 减少不必要的渲染

### 7.5 数据统计
1. 在微信公众平台配置数据统计
2. 查看用户访问数据
3. 分析用户行为
4. 根据数据优化小程序

---

## 附录

### A. 参考资料
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信小程序开发指南](https://developers.weixin.qq.com/miniprogram/dev/guide/)
- [微信小程序组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/)

### B. 联系支持
- 如有问题，可以访问 [微信开放社区](https://developers.weixin.qq.com/community/)
- 或联系微信官方技术支持

---

祝您部署顺利！
