# 员工评估标准 RAG 服务

这个目录包含了用于员工评估的 RAG (Retrieval-Augmented Generation) 服务的数据文件。

## 文件说明

- `staffRubric.json`: 包含员工评估标准的 JSON 文件，按不同类别组织
- `staffRubricBackup.json`: 备份文件，由 RAG 服务自动生成

## 评估标准类别

1. 工作质量
2. 工作效率
3. 团队合作
4. 创新能力
5. 专业发展
6. 客户服务
7. 领导能力
8. 沟通能力
9. 问题解决能力
10. 适应能力

每个类别都包含三个级别的评估标准：
- 优秀
- 良好
- 需要改进

## 使用方法

### 在代码中使用

```typescript
import { ragService } from '@/app/lib/ragService';

// 加载员工评估标准
await ragService.loadDemoStaffRubric();

// 搜索相关评估标准
const results = await ragService.search('领导能力和团队管理');

// 显示结果
results.forEach(doc => {
  console.log(doc.content);
});
```

### 运行演示脚本

```bash
# 使用 ts-node 运行演示脚本
npx ts-node src/app/scripts/demoRagService.ts
```

## 扩展数据

要添加新的评估标准，可以编辑 `staffRubric.json` 文件，按照以下格式添加新的文档：

```json
{
  "documents": [
    {
      "id": "unique-id",
      "content": "评估标准内容..."
    }
  ]
}
```

## 注意事项

- 当前实现使用随机向量作为嵌入，仅用于演示目的
- 在生产环境中，应使用适当的嵌入模型（如 OpenAI 的 text-embedding-3-small）
- 文件操作使用 Node.js 的 fs 模块，确保在适当的环境中运行 