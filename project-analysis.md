# 项目全面分析文档

## 一、项目概述

### 1.1 项目简介
本项目是一个面向沈阳航空航天大学的校园活动抢票小程序，旨在为学生提供便捷的活动报名和票务管理服务。

**项目特点**：
- 前后端分离架构
- 微信小程序原生开发
- NestJS 后端框架
- 支持高并发抢票
- 实时票务状态管理

### 1.2 技术栈概览

**后端技术**：
- 运行环境：Node.js 16+
- 开发语言：TypeScript
- Web框架：NestJS 11.0
- ORM框架：TypeORM 0.3
- 数据库：SQLite（开发）/ PostgreSQL（生产）
- 缓存：Redis 6+（可选）
- 消息队列：RabbitMQ 3+（可选）

**前端技术**：
- 框架：微信小程序原生开发
- UI组件：原生组件库
- 状态管理：微信小程序数据绑定
- 网络请求：wx.request API

## 二、系统架构详解

### 2.1 整体架构图
```
┌──────────────────────────────────────────────────────────┐
│                     微信小程序                          │
│   (首页/抢票/活动详情/我的/发布活动管理)              │
└────────────────────┬─────────────────────────────────┘
                     │ HTTPS/WSS
┌────────────────────▼─────────────────────────────────┐
│                  NestJS 后端服务                      │
│   (ActivitiesModule / TicketsModule)                │
└────────────────────┬─────────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐     ┌─────▼────┐    ┌──────▼─────┐
│ Redis │     │ SQLite  │    │ RabbitMQ  │
│(可选) │     │ PostgreSQL│    │ (可选)   │
└───────┘     └──────────┘    └───────────┘
```

### 2.2 后端架构

#### 2.2.1 模块结构
```
backend/src/
├── main.ts                    # 应用入口
├── app.module.ts             # 根模块
├── activities/              # 活动管理模块
│   ├── activities.controller.ts
│   ├── activities.service.ts
│   └── activities.module.ts
├── tickets/               # 票务管理模块
│   ├── tickets.controller.ts
│   ├── tickets.service.ts
│   └── tickets.module.ts
└── entities/             # 数据实体
    ├── activity.entity.ts
    ├── ticket.entity.ts
    ├── ticket-stub.entity.ts
    └── user.entity.ts
```

#### 2.2.2 核心功能模块

**ActivitiesModule（活动管理）**：
- 创建活动
- 查询活动列表
- 查询活动详情
- 更新活动信息
- 删除活动
- 获取活动及关联票务

**TicketsModule（票务管理）**：
- 同步抢票
- 异步抢票（消息队列）
- 查询门票
- 查询用户票务
- 生成票根二维码

### 2.3 前端架构

#### 2.3.1 页面结构
```
frontend/pages/
├── index/              # 首页
│   ├── index.js
│   ├── index.wxml
│   └── index.wxss
├── booking/           # 抢票页面
├── activity/         # 活动详情
├── ticket/          # 票根详情
├── mine/            # 我的中心
└── admin/          # 发布活动管理
```

#### 2.3.2 页面功能

| 页面 | 功能描述 | 核心交互 |
|------|---------|----------|
| 首页 | 展示活动列表、公告 | 活动卡片展示 |
| 抢票 | 全部活动列表、筛选 | 活动筛选 |
| 活动详情 | 活动信息、倒计时、抢票 | 抢票操作 |
| 票根详情 | 二维码、座位号 | 二维码展示 |
| 我的 | 用户信息、票务列表 | 票务管理 |
| 发布活动 | 身份验证、活动发布 | 表单提交 |

## 三、数据库设计

### 3.1 数据表结构

#### Activities（活动表）
| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 活动ID | PRIMARY KEY |
| title | VARCHAR(255) | 活动标题 | NOT NULL |
| description | TEXT | 活动描述 | NOT NULL |
| totalTickets | INTEGER | 总票数 | NOT NULL |
| availableTickets | INTEGER | 剩余票数 | NOT NULL |
| startTime | DATE | 开始时间 | NOT NULL |
| endTime | DATE | 结束时间 | NOT NULL |
| status | VARCHAR(20) | 活动状态 | DEFAULT 'pending' |
| qrCodeUrl | VARCHAR(255) | 二维码URL | |
| createdAt | DATE | 创建时间 | AUTO |
| updatedAt | DATE | 更新时间 | AUTO |

**状态枚举**：pending（待开始）、active（进行中）、ended（已结束）、cancelled（已取消）

#### Users（用户表）
| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 用户ID | PRIMARY KEY |
| openid | VARCHAR(255) | 微信openid | UNIQUE, NOT NULL |
| nickname | VARCHAR(255) | 昵称 | |
| avatarUrl | VARCHAR(512) | 头像URL | |
| studentId | VARCHAR(50) | 学号 | |
| name | VARCHAR(100) | 真实姓名 | |

#### Tickets（门票表）
| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 门票ID | PRIMARY KEY |
| activityId | INTEGER | 活动ID | FK |
| userId | INTEGER | 用户ID | FK |
| ticketNumber | VARCHAR(50) | 票号 | UNIQUE, NOT NULL |
| seatNumber | VARCHAR(50) | 座位号 | NOT NULL |
| status | VARCHAR(20) | 门票状态 | DEFAULT 'valid' |

**状态枚举**：valid（有效）、used（已使用）、invalid（无效）

#### Ticket_Stubs（票根表）
| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 票根ID | PRIMARY KEY |
| ticketId | INTEGER | 门票ID | FK |
| qrCodeUrl | VARCHAR(255) | 二维码URL | NOT NULL |
| generatedAt | DATE | 生成时间 | AUTO |

### 3.2 关系图
```
┌─────────────┐
│   users     │
│  (用户)    │
└─────┬───────┘
      │
      │ 1:N
      ▼
┌─────────────┐
│   tickets   │
│  (门票)    │◀────────────┐
└─────────────┘            │
      │                   │ N:1
      │                   │
      │ 1:1              │
      ▼                   │ 1:N
┌─────────────┐           │
│ ticket_stubs│           │
│  (票根)    │           │
└─────────────┘           │
                    ┌─────────────┐
                    │ activities │
                    │  (活动)   │
                    └───────────┘
```

### 3.3 索引设计
- `idx_activities_status` - 活动状态索引
- `idx_activities_start_time` - 开始时间索引
- `idx_tickets_user_id` - 用户ID索引
- `idx_tickets_ticket_number` - 票号唯一索引

## 四、API接口文档

### 4.1 活动管理接口

#### POST /activities - 创建活动
**请求参数**：
```json
{
  "title": "2026春季运动会",
  "description": "精彩的运动会",
  "totalTickets": 500,
  "startTime": "2026-04-20T09:00:00",
  "endTime": "2026-04-25T18:00:00",
  "status": "active"
}
```

**响应示例**：
```json
{
  "id": 1,
  "title": "2026春季运动会",
  "qrCodeUrl": "data:image/png;base64,..."
}
```

#### GET /activities - 获取活动列表
**响应示例**：
```json
[{
  "id": 1,
  "title": "2026春季运动会",
  "availableTickets": 499,
  "status": "active"
}]
```

#### GET /activities/:id - 获取活动详情
**响应示例**：
```json
{
  "id": 1,
  "title": "2026春季运动会",
  "totalTickets": 500,
  "availableTickets": 499,
  "qrCodeUrl": "data:image/png;base64,..."
}
```

#### PATCH /activities/:id - 更新活动
#### DELETE /activities/:id - 删除活动
#### GET /activities/:id/tickets - 获取活动票务

### 4.2 票务管理接口

#### POST /tickets/book - 同步抢票
**请求参数**：
```json
{
  "activityId": 1,
  "userId": 1
}
```

**响应示例**：
```json
{
  "id": 1,
  "ticketNumber": "T17759975933492731",
  "seatNumber": "2",
  "status": "valid"
}
```

#### POST /tickets/book/async - 异步抢票
#### GET /tickets/by-number/:ticketNumber - 查询门票
#### GET /tickets/user/:userId - 查询用户票务

## 五、功能清单

### 5.1 已实现功能

#### 前端功能
| 功能 | 状态 | 说明 |
|------|------|------|
| 首页展示 | ✅ | 活动列表、公告轮播 |
| 活动列表 | ✅ | 全部活动、筛选功能 |
| 活动详情 | ✅ | 倒计时、抢票按钮 |
| 抢票功能 | ✅ | 同步/异步抢票 |
| 票根展示 | ✅ | 二维码、座位号 |
| 我的中心 | ✅ | 用户信息、票务列表 |
| 发布活动 | ✅ | 身份验证、活动发布 |
| 模拟数据降级 | ✅ | API失败时自动降级 |

#### 后端功能
| 功能 | 状态 | 说明 |
|------|------|------|
| 活动CRUD | ✅ | 完整的活动管理 |
| 抢票逻辑 | ✅ | 事务控制、并发处理 |
| 票根生成 | ✅ | 二维码生成 |
| 用户管理 | ✅ | 自动创建用户 |
| 缓存降级 | ✅ | Redis不可用时降级 |
| 消息队列降级 | ✅ | RabbitMQ不可用时降级 |

### 5.2 待开发功能

#### 功能优化
- [ ] 微信登录集成
- [ ] 用户权限管理
- [ ] 活动审核流程
- [ ] 消息通知
- [ ] 数据统计后台

#### 性能优化
- [ ] Redis缓存完整集成
- [ ] RabbitMQ消息队列完整集成
- [ ] 数据库连接池优化
- [ ] API限流

#### 安全增强
- [ ] JWT认证
- [ ] 参数验证
- [ ] SQL注入防护
- [ ] XSS防护

## 六、部署指南

### 6.1 开发环境部署

#### 后端部署
```bash
# 1. 安装依赖
cd backend
npm install

# 2. 启动服务
npm run start:dev
# 服务运行在 http://localhost:3000
```

#### 前端部署
```bash
# 1. 使用微信开发者工具打开 frontend 目录
# 2. 配置 AppID
# 3. 勾选"不校验合法域名"
# 4. 编译运行
```

### 6.2 生产环境部署

#### 环境要求
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- RabbitMQ 3+

#### 配置步骤
1. 配置数据库连接
2. 配置Redis缓存
3. 配置RabbitMQ
4. 配置微信小程序AppID
5. 部署后端服务
6. 配置Nginx反向代理
7. 配置HTTPS证书

## 七、开发指南

### 7.1 项目启动流程

#### 后端启动
```bash
cd backend
npm install
npm run start:dev
# 访问 http://localhost:3000
```

#### 前端启动
1. 打开微信开发者工具
2. 导入 `frontend` 目录
3. 设置AppID
4. 编译运行

### 7.2 添加新页面

1. 在 `pages/` 下创建页面目录
2. 创建 `page.js`、`page.wxml`、`page.wxss`、`page.json`
3. 在 `app.json` 中注册页面
4. 实现页面逻辑

### 7.3 添加新API

1. 在对应的 Module 中添加 Controller
2. 实现 Service 逻辑
3. 定义数据模型（Entity）
4. 编写测试用例

## 八、常见问题

### Q1: 后端启动失败？
**A**: 检查端口3000是否被占用，或查看错误日志。

### Q2: 前端无法连接后端？
**A**: 确保后端服务已启动，且在小程序中勾选"不校验合法域名"。

### Q3: Redis/RabbitMQ连接失败？
**A**: 这些服务为可选服务，系统会自动降级到模拟模式，不影响核心功能。

### Q4: 如何获取负责人编号？
**A**: 当前系统预设编号为 `ADMIN2024`，可在 `admin. js` 中修改。

### Q5: 如何查看API文档？
**A**: 后端服务启动后，访问 http://localhost:3000 查看 Swagger 文档（如已配置）。

## 九、项目结构总结

### 9.1 文件清单

#### 后端文件
- `backend/src/main.ts` - 应用入口
- `backend/src/app.module.ts` - 根模块
- `backend/src/activities/` - 活动模块
- `backend/src/tickets/` - 票务模块
- `backend/src/entities/` - 数据实体

#### 前端文件
- `frontend/app.json` - 应用配置
- `frontend/pages/index/` - 首页
- `frontend/pages/booking/` - 抢票页
- `frontend/pages/activity/` - 活动详情
- `frontend/pages/ticket/` - 票根详情
- `frontend/pages/mine/` - 我的中心
- `frontend/pages/admin/` - 发布活动管理

### 9.2 技术亮点

1. **前后端分离**：独立开发，易于维护
2. **TypeORM集成**：类型安全的数据访问
3. **NestJS模块化**：清晰的架构划分
4. **降级策略**：保证系统可用性
5. **微信原生开发**：性能优异，用户体验好
6. **响应式设计**：适配多端设备
7. **表单自动保存**：防止数据丢失
8. **进度指示**：提升用户体验

### 9.3 后续发展建议

1. **微服务架构**：按业务拆分
2. **Docker部署**：环境一致性
3. **CI/CD**：自动化部署
4. **监控告警**：运维保障
5. **数据分析**：用户行为分析
6. **营销功能**：优惠券、积分系统

## 十、联系方式

如有问题，请联系项目负责人或提交 Issue。

---

**文档版本**：1.0  
**最后更新**：2026-04-12  
**维护者**：项目团队