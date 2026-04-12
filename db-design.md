# 数据库设计

## 1. 表结构

### 1.1 活动表（activities）

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | 活动ID |
| `title` | `VARCHAR(255)` | `NOT NULL` | 活动标题 |
| `description` | `TEXT` | `NOT NULL` | 活动描述 |
| `total_tickets` | `INTEGER` | `NOT NULL` | 总票数 |
| `available_tickets` | `INTEGER` | `NOT NULL` | 剩余票数 |
| `start_time` | `TIMESTAMP` | `NOT NULL` | 抢票开始时间 |
| `end_time` | `TIMESTAMP` | `NOT NULL` | 抢票结束时间 |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` | 活动状态（pending, active, ended, cancelled） |
| `qr_code_url` | `VARCHAR(255)` | | 活动二维码URL |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 更新时间 |

### 1.2 用户表（users）

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | 用户ID |
| `openid` | `VARCHAR(255)` | `UNIQUE NOT NULL` | 微信小程序openid |
| `nickname` | `VARCHAR(255)` | | 用户昵称 |
| `avatar_url` | `VARCHAR(512)` | | 用户头像URL |
| `student_id` | `VARCHAR(50)` | | 学生证号 |
| `name` | `VARCHAR(100)` | | 真实姓名 |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 更新时间 |

### 1.3 门票表（tickets）

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | 门票ID |
| `activity_id` | `INTEGER` | `REFERENCES activities(id)` | 活动ID |
| `user_id` | `INTEGER` | `REFERENCES users(id)` | 用户ID |
| `ticket_number` | `VARCHAR(50)` | `UNIQUE NOT NULL` | 门票编号 |
| `seat_number` | `VARCHAR(50)` | `NOT NULL` | 座位号 |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'valid'` | 门票状态（valid, used, invalid） |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |

### 1.4 票根表（ticket_stubs）

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | 票根ID |
| `ticket_id` | `INTEGER` | `REFERENCES tickets(id)` | 门票ID |
| `qr_code_url` | `VARCHAR(255)` | `NOT NULL` | 票根二维码URL |
| `generated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | 生成时间 |

## 2. 索引设计

### 2.1 活动表索引
- `idx_activities_status` - 活动状态索引
- `idx_activities_start_time` - 开始时间索引
- `idx_activities_end_time` - 结束时间索引

### 2.2 用户表索引
- `idx_users_openid` - openid唯一索引
- `idx_users_student_id` - 学生证号索引

### 2.3 门票表索引
- `idx_tickets_activity_id` - 活动ID索引
- `idx_tickets_user_id` - 用户ID索引
- `idx_tickets_ticket_number` - 门票编号唯一索引
- `idx_tickets_status` - 门票状态索引

## 3. 关系图

```
┌─────────────┐     ┌─────────────┐
│   users     │◄────┤   tickets   │
└─────────────┘     └─────────────┘
                        ▲
                        │
┌─────────────┐     ┌─────────────┐
│ activities  │────►│ticket_stubs │
└─────────────┘     └─────────────┘
```

## 4. 数据一致性保障

1. **事务控制**：使用 PostgreSQL 事务确保抢票操作的原子性
2. **乐观锁**：在活动表中使用版本号字段，防止并发更新冲突
3. **唯一约束**：确保门票编号的唯一性
4. **外键约束**：维护表之间的关系完整性
5. **触发器**：当抢票成功时，自动更新活动表中的剩余票数

## 5. 并发处理策略

1. **数据库层面**：
   - 使用 `SELECT FOR UPDATE` 锁定活动记录
   - 使用事务确保数据一致性

2. **应用层面**：
   - 使用 Redis 缓存活动剩余票数
   - 使用 Redis 分布式锁防止重复抢票
   - 使用消息队列异步处理抢票请求

3. **索引优化**：
   - 为频繁查询的字段创建索引
   - 优化 SQL 查询语句

## 6. 数据备份与恢复

- 定期备份数据库
- 制定灾难恢复计划
- 测试数据恢复流程
