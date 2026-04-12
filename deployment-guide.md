# 部署指南

## 1. 环境准备

### 1.1 系统要求
- Node.js 16.x 或更高版本
- PostgreSQL 12.x 或更高版本
- Redis 6.x 或更高版本
- RabbitMQ 3.x 或更高版本

### 1.2 安装依赖

```bash
# 安装 Node.js 依赖
cd backend
npm install

# 安装全局依赖（可选）
npm i -g @nestjs/cli
```

## 2. 配置文件设置

### 2.1 环境变量配置

复制 `.env.example` 文件并修改为 `.env`，然后根据实际环境配置以下参数：

```bash
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ticketing_system

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ配置
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 服务器配置
PORT=3000
NODE_ENV=production
```

### 2.2 数据库初始化

```bash
# 启动 PostgreSQL 服务
sudo service postgresql start

# 创建数据库
psql -U postgres -c "CREATE DATABASE ticketing_system;"

# 启动 Redis 服务
sudo service redis-server start

# 启动 RabbitMQ 服务
sudo service rabbitmq-server start
```

## 3. 构建和启动服务

### 3.1 构建项目

```bash
cd backend
npm run build
```

### 3.2 启动服务

```bash
# 生产环境启动
npm run start:prod

# 开发环境启动
npm run start:dev
```

## 4. 微信小程序部署

### 4.1 小程序配置

在微信开发者工具中打开 `frontend` 目录，然后：

1. 点击「设置」->「项目设置」
2. 填写「AppID」和「AppSecret」
3. 点击「确定」保存设置

### 4.2 上传代码

1. 点击「上传」按钮
2. 填写版本号和描述
3. 点击「上传」按钮

### 4.3 审核和发布

1. 登录微信公众平台
2. 进入「小程序管理」->「版本管理」
3. 提交审核
4. 审核通过后发布

## 5. 性能优化

### 5.1 数据库优化
- 创建合适的索引
- 优化 SQL 查询
- 使用连接池

### 5.2 缓存优化
- 使用 Redis 缓存活动信息
- 设置合理的缓存过期时间

### 5.3 服务优化
- 启用 gzip 压缩
- 设置合理的 HTTP 缓存头
- 使用负载均衡

## 6. 监控和日志

### 6.1 监控
- 使用 Prometheus + Grafana 监控系统
- 设置告警机制

### 6.2 日志
- 使用 ELK 栈收集和分析日志
- 设置日志轮转

## 7. 故障处理

### 7.1 常见问题
- 数据库连接失败：检查数据库服务是否正常运行，配置是否正确
- Redis 连接失败：检查 Redis 服务是否正常运行，配置是否正确
- RabbitMQ 连接失败：检查 RabbitMQ 服务是否正常运行，配置是否正确
- 微信小程序登录失败：检查 AppID 和 AppSecret 是否正确

### 7.2 应急措施
- 备份数据库
- 配置自动重启服务
- 设置监控告警
