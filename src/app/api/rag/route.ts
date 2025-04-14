import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/app/lib/ragService';

// Initialize the RAG service with the staff rubric
async function initializeRagService() {
  try {
    await ragService.loadDemoStaffRubric();
    console.log('RAG service initialized with staff rubric');
  } catch (error) {
    console.error('Failed to initialize RAG service:', error);
  }
}

// Initialize the service when the API route is first loaded
initializeRagService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query, topK, content, id } = body;

    console.log(`RAG API called with action: ${action}`);

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required for search action' },
            { status: 400 }
          );
        }
        
        try {
          const results = await ragService.search(query, topK);
          return NextResponse.json({ results });
        } catch (error) {
          console.error('Error in RAG search:', error);
          return NextResponse.json(
            { error: 'Error performing search', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
          );
        }

      case 'addDocument':
        if (!content) {
          return NextResponse.json(
            { error: 'Content parameter is required for addDocument action' },
            { status: 400 }
          );
        }
        
        try {
          await ragService.addDocument(content, id);
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error adding document:', error);
          return NextResponse.json(
            { error: 'Error adding document', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
          );
        }

      case 'getAllDocuments':
        try {
          const documents = ragService.getAllDocuments();
          return NextResponse.json({ documents });
        } catch (error) {
          console.error('Error getting all documents:', error);
          return NextResponse.json(
            { error: 'Error getting documents', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
          );
        }

      case 'loadDemoStaffRubric':
        try {
          await ragService.loadDemoStaffRubric();
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error loading demo staff rubric:', error);
          return NextResponse.json(
            { error: 'Error loading demo staff rubric', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in RAG API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 