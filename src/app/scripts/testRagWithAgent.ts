import { ragService } from '../lib/ragService';
import { ragSearchToolLogic } from '../agentConfigs/ragTool';

interface Document {
  id: string;
  content: string;
  embedding: number[];
}

async function testRagWithAgent() {
  try {
    console.log('Loading staff rubric...');
    await ragService.loadDemoStaffRubric();
    
    // Test queries that the agent might use
    const testQueries = [
      '领导能力和团队管理',
      '沟通能力和表达能力',
      '问题解决和分析能力',
      '工作效率和时间管理',
      '客户服务和关系维护'
    ];
    
    console.log('\n--- Testing RAG Service with Agent-like Queries ---');
    
    for (const query of testQueries) {
      console.log(`\nQuery: "${query}"`);
      
      // Test direct RAG service
      console.log('\nDirect RAG Service Results:');
      const directResults = await ragService.search(query);
      directResults.forEach((doc: Document, index: number) => {
        console.log(`\nResult ${index + 1} (ID: ${doc.id}):`);
        console.log(doc.content.substring(0, 200) + '...');
      });
      
      // Test through agent tool logic
      console.log('\nAgent Tool Logic Results:');
      const toolResults = await ragSearchToolLogic.ragSearch({ query });
      if (toolResults.success) {
        toolResults.results.forEach((doc: { id: string; content: string }, index: number) => {
          console.log(`\nResult ${index + 1} (ID: ${doc.id}):`);
          console.log(doc.content.substring(0, 200) + '...');
        });
      } else {
        console.log('Error:', toolResults.error);
      }
      
      console.log('\n' + '-'.repeat(80));
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testRagWithAgent(); 