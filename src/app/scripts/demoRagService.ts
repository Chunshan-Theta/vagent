import { ragService } from '../lib/ragService';

async function demoRagService() {
  try {
    console.log('Loading staff rubric...');
    await ragService.loadDemoStaffRubric();
    
    console.log('\n--- Demo 1: Search for leadership criteria ---');
    const leadershipResults = await ragService.search('领导能力和团队管理');
    console.log('Results:');
    leadershipResults.forEach((doc, index) => {
      console.log(`\nResult ${index + 1} (ID: ${doc.id}):`);
      console.log(doc.content);
    });
    
    console.log('\n--- Demo 2: Search for communication skills ---');
    const communicationResults = await ragService.search('沟通能力和表达能力');
    console.log('Results:');
    communicationResults.forEach((doc, index) => {
      console.log(`\nResult ${index + 1} (ID: ${doc.id}):`);
      console.log(doc.content);
    });
    
    console.log('\n--- Demo 3: Search for problem solving ---');
    const problemSolvingResults = await ragService.search('问题解决和分析能力');
    console.log('Results:');
    problemSolvingResults.forEach((doc, index) => {
      console.log(`\nResult ${index + 1} (ID: ${doc.id}):`);
      console.log(doc.content);
    });
    
    console.log('\n--- Demo 4: Save current documents to a new file ---');
    const savePath = './src/app/data/rag/staffRubricBackup.json';
    await ragService.saveToFile(savePath);
    console.log(`Documents saved to ${savePath}`);
    
    console.log('\n--- Demo 5: Clear and reload documents ---');
    ragService.clearDocuments();
    console.log('Documents cleared');
    await ragService.loadFromFile(savePath);
    console.log('Documents reloaded from backup');
    
    console.log('\nDemo completed successfully!');
  } catch (error) {
    console.error('Error in demo:', error);
  }
}

// Run the demo
demoRagService(); 