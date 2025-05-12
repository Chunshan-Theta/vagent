import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Edit Tool",
}

export default function EditToolPage(props: any) {
  return (
    <div>
      <h1>Edit Tool {props.params.id}</h1>
    </div>
  )
} 