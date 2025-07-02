import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Check content type to handle different types of requests
    const contentType = req.headers.get('content-type');

    let data: any = {};

    if (contentType?.includes('multipart/form-data')) {
      // Handle multipart form data (files and fields)
      const formData = await req.formData();
      
      // Process all form fields and files
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          // Handle file
          const fileBuffer = await value.arrayBuffer();
          const fileName = value.name;
          const fileType = value.type;
          
          // Store file info in data object
          data[key] = {
            fileName,
            fileType,
            fileBuffer: Buffer.from(fileBuffer),
            size: value.size
          };
        } else {
          // Handle regular form fields
          data[key] = value;
        }
      }
    } else {
      // Handle JSON data
      data = await req.json();
    }

    // TODO: Process the data according to your needs
    // For example, you might want to:
    // - Save files to storage
    // - Process parameters
    // - Call other services

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        ...data,
        // Remove binary data from response
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [
            k,
            v?.fileBuffer ? { ...v, fileBuffer: undefined } : v
          ])
        )
      }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
