// Use dynamic imports for Node.js modules to avoid client-side errors
let fs: any = null;
let path: any = null;

// Only import Node.js modules on the server side
if (typeof window === 'undefined') {
  // We're on the server
  Promise.all([
    import('fs').then(module => { fs = module.default; }),
    import('path').then(module => { path = module.default; })
  ]).catch(error => {
    console.error('Error loading Node.js modules:', error);
  });
}

interface Document {
  id: string;
  content: string;
  embedding: number[];
}

class RAGService {
  private documents: Document[] = [];
  private embeddingModel: string = 'text-embedding-3-small';
  private embeddingDimension: number = 1536; // Default dimension for OpenAI embeddings

  constructor() {}

  async addDocument(content: string, id?: string): Promise<void> {
    const embedding = await this.getEmbedding(content);
    this.documents.push({
      id: id || Math.random().toString(36).substring(7),
      content,
      embedding
    });
  }

  async search(query: string, topK: number = 3): Promise<Document[]> {
    try {
      const queryEmbedding = await this.getEmbedding(query);
      
      // Calculate cosine similarity
      const similarities = this.documents.map(doc => {
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        return { ...doc, similarity };
      });

      // Sort by similarity and return top K results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(({ id, content, embedding }) => ({ id, content, embedding }));
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }

  private async getEmbedding(content: string): Promise<number[]> {
    // This is a placeholder. In production, you would use OpenAI's embedding API
    // For now, we'll use a simple random vector for demonstration
    // Use content length to seed the random number generator for consistent results
    const seed = content.length;
    return Array.from(
      { length: this.embeddingDimension },
      (_, i) => Math.random() * Math.cos(seed + i)
    );
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    // Ensure both vectors have the same length
    if (a.length !== b.length) {
      console.warn(`Vectors have different lengths: ${a.length} vs ${b.length}. Truncating to shorter length.`);
      const minLength = Math.min(a.length, b.length);
      a = a.slice(0, minLength);
      b = b.slice(0, minLength);
    }
    
    // Check if vectors are empty
    if (a.length === 0 || b.length === 0) {
      console.warn('Empty vectors provided to cosineSimilarity');
      return 0;
    }
    
    try {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      
      // Avoid division by zero
      if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
      }
      
      return dotProduct / (magnitudeA * magnitudeB);
    } catch (error) {
      console.error('Error calculating cosine similarity:', error);
      return 0;
    }
  }

  // Save documents to a file - server-side only
  async saveToFile(filepath: string): Promise<void> {
    if (typeof window !== 'undefined') {
      console.warn('File operations are only available on the server side');
      return;
    }
    
    try {
      const data = JSON.stringify({ documents: this.documents }, null, 2);
      await fs.promises.writeFile(filepath, data, 'utf8');
      console.log(`Successfully saved documents to ${filepath}`);
    } catch (error) {
      console.error(`Error saving documents to ${filepath}:`, error);
      throw error;
    }
  }

  // Load documents from a file - server-side only
  async loadFromFile(filepath: string): Promise<void> {
    if (typeof window !== 'undefined') {
      console.warn('File operations are only available on the server side');
      return;
    }
    
    try {
      const data = await fs.promises.readFile(filepath, 'utf8');
      const parsedData = JSON.parse(data);
      
      if (parsedData.documents && Array.isArray(parsedData.documents)) {
        // Ensure all documents have embeddings
        this.documents = parsedData.documents.map((doc: any) => {
          if (!doc.embedding || !Array.isArray(doc.embedding)) {
            // Generate a new embedding if missing or invalid
            console.warn(`Document ${doc.id} has missing or invalid embedding. Generating new one.`);
            return {
              ...doc,
              embedding: Array.from({ length: this.embeddingDimension }, () => Math.random())
            };
          }
          return doc;
        });
        console.log(`Successfully loaded ${this.documents.length} documents from ${filepath}`);
      } else {
        throw new Error('Invalid document format in file');
      }
    } catch (error) {
      console.error(`Error loading documents from ${filepath}:`, error);
      throw error;
    }
  }

  // Load demo staff rubric - server-side only
  async loadDemoStaffRubric(): Promise<void> {
    if (typeof window !== 'undefined') {
      console.warn('File operations are only available on the server side');
      return;
    }

    // Wait for modules to be loaded
    if (!fs || !path) {
      await new Promise<void>((resolve) => {
        const checkModules = () => {
          if (fs && path) {
            resolve();
          } else {
            setTimeout(checkModules, 100);
          }
        };
        checkModules();
      });
    }

    try {
      const demoFilePath = path.join(process.cwd(), 'src', 'app', 'data', 'staff_rubric.txt');
      const content = fs.readFileSync(demoFilePath, 'utf8');
      const sections = content.split('\n\n');
      
      for (const section of sections) {
        if (section.trim()) {
          await this.addDocument(section.trim());
        }
      }
    } catch (error) {
      console.error('Error loading demo staff rubric:', error);
    }
  }

  // Get all documents
  getAllDocuments(): Document[] {
    return [...this.documents];
  }

  // Clear all documents
  clearDocuments(): void {
    this.documents = [];
  }
}

export const ragService = new RAGService(); 