# 数据库现状与规范化清单

## 当前现状
当前后端使用 SQLite，核心表如下：
- `activities`
- `users`
- `tickets`
- `ticket_stubs`
- `admin_accounts`
- `admin_activity_drafts`

当前实现的特点：
- 通过 TypeORM `synchronize: true` 自动建表
- 已存在基础唯一约束，如 `users.phone`、`users.studentId`、`tickets.ticketNumber`
- `tickets` 与 `users`、`activities` 已建立外键关系
- 管理员账号与草稿能力已经独立建模

## 已确认的问题
### 1. 命名风格不统一
- 代码层大量使用 camelCase 字段，如 `availableTickets`
- 文档历史版本混杂 snake_case 设计，如 `available_tickets`
- 后续如果切到 PostgreSQL 或写迁移脚本，命名差异会放大维护成本

### 2. `availableTickets` 属于衍生字段
- 它本质上可以由 `totalTickets - 已出票数` 推导
- 当前保留该字段可以提升读性能，但需要严格保证更新一致性
- 目前主要依赖业务代码在抢票事务里手动扣减

### 3. 时间字段类型不完全一致
- `activities.createdAt` / `updatedAt` 使用 `datetime`
- `users.createdAt` / `updatedAt`、`tickets.createdAt`、`admin_accounts.createdAt` 等部分字段使用 `date`
- 这会让排序、审计和跨表对账变得不稳定

### 4. 约束仍然偏弱
- `activities` 没有限制 `totalTickets >= 0`
- `availableTickets` 没有限制不能大于 `totalTickets`
- `status` 字段仍是普通字符串，没有枚举或检查约束
- `admin_activity_drafts` 依赖单字段唯一约束，语义上更适合联合唯一键

### 5. 迁移策略缺失
- 当前依赖 `synchronize: true`
- 适合开发联调，不适合后续持续演进
- 一旦数据库中已有真实数据，自动同步可能带来不可控风险

## 建议的规范化方向
### 第一阶段：低风险整理
- 保持现有表名不变，先统一字段命名策略，明确后续继续使用 camelCase 还是切换 snake_case
- 把所有审计时间字段统一到 `datetime` 或等价的完整时间类型
- 补充关键索引：
  - `activities(status, startTime)`
  - `activities(adminAccountId, createdAt)`
  - `tickets(userId, createdAt)`
  - `tickets(activityId, userId)`
- 为活动状态、票据状态补充枚举常量，并在服务层统一校验入口

### 第二阶段：约束增强
- 为票数相关字段增加检查约束
- 明确 `admin_activity_drafts` 是否应改为 `(adminAccountId, adminUserId)` 联合唯一
- 明确 `ticket_stubs.ticketId` 的一对一关系是否还需要额外索引或唯一声明

### 第三阶段：迁移治理
- 从 `synchronize: true` 迁移到正式 migration
- 先冻结现有 schema，再生成第一版基线迁移
- 所有后续表结构调整都通过 migration 执行

## 推荐落地顺序
1. 先冻结命名规范和字段语义
2. 再统一时间字段类型
3. 然后补索引和约束
4. 最后引入 migration，替代 `synchronize: true`

## 本轮不建议立即做的事
- 不建议现在直接重命名全部表和字段
- 不建议在联调阶段切换到 PostgreSQL
- 不建议在没有迁移基线的情况下直接手工修改线上式数据库文件
