import { Metadata } from "next"
import ToolForm from '../../components/ToolForm'
import { getToolConfig } from '@/db'

export const metadata: Metadata = {
  title: "Edit Tool",
}

export default async function EditToolPage({ params }: any) {
  const tool = await getToolConfig(params.id)
  
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ToolForm mode="edit" tool={tool} />
} 