import { createClient } from "@/lib/supabase/client"

const BUCKET_NAME = "project-images"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export interface UploadResult {
  url: string
  path: string
}

export interface UploadError {
  message: string
  code?: string
}

/**
 * Validate an image file before upload
 */
export function validateImage(file: File): UploadError | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      message: "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.",
      code: "INVALID_TYPE",
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      message: "File too large. Maximum size is 5MB.",
      code: "FILE_TOO_LARGE",
    }
  }

  return null
}

/**
 * Generate a unique filename for uploads
 */
function generateFilename(file: File): string {
  const timestamp = Date.now()
  const uuid = crypto.randomUUID()
  const ext = file.name.split(".").pop() || "jpg"
  return `${timestamp}-${uuid}.${ext}`
}

/**
 * Upload a project avatar image
 */
export async function uploadProjectAvatar(
  userId: string,
  projectId: string,
  file: File
): Promise<UploadResult> {
  const supabase = createClient()

  const validationError = validateImage(file)
  if (validationError) {
    throw new Error(validationError.message)
  }

  const ext = file.name.split(".").pop() || "jpg"
  const path = `${userId}/${projectId}/avatar.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
  }
}

/**
 * Upload a project screenshot
 */
export async function uploadProjectScreenshot(
  userId: string,
  projectId: string,
  file: File,
  order: number
): Promise<UploadResult> {
  const supabase = createClient()

  const validationError = validateImage(file)
  if (validationError) {
    throw new Error(validationError.message)
  }

  const filename = generateFilename(file)
  const path = `${userId}/${projectId}/screenshots/${order}-${filename}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload screenshot: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
  }
}

/**
 * Delete a project image from storage
 */
export async function deleteProjectImage(path: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Delete multiple project images
 */
export async function deleteProjectImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const supabase = createClient()

  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths)

  if (error) {
    throw new Error(`Failed to delete images: ${error.message}`)
  }
}

/**
 * Delete all images for a project
 */
export async function deleteAllProjectImages(
  userId: string,
  projectId: string
): Promise<void> {
  const supabase = createClient()

  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`${userId}/${projectId}`, {
      limit: 100,
    })

  if (listError) {
    throw new Error(`Failed to list project images: ${listError.message}`)
  }

  if (files && files.length > 0) {
    const paths = files.map((file) => `${userId}/${projectId}/${file.name}`)

    // Also list screenshots folder
    const { data: screenshots } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${userId}/${projectId}/screenshots`, {
        limit: 100,
      })

    if (screenshots && screenshots.length > 0) {
      paths.push(
        ...screenshots.map(
          (file) => `${userId}/${projectId}/screenshots/${file.name}`
        )
      )
    }

    await deleteProjectImages(paths)
  }
}

/**
 * Get the public URL for an image path
 */
export function getPublicUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Extract the storage path from a public URL
 */
export function getPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/public\/project-images\/(.+)/
    )
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}
