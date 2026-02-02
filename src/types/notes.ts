export type Note = {
  id: string
  user_id: string
  title: string
  content_json: Record<string, unknown> | null
  content_text: string | null
  pinned: boolean
  created_at: string
  updated_at: string
}
