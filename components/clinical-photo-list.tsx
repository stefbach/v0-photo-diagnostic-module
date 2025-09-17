"use client"

import { useState, useEffect } from "react"
import { Trash2, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { ClinicalPhoto } from "@/lib/types/medical"

interface ClinicalPhotoListProps {
  consultationId: string
  onPhotosChange?: (photos: ClinicalPhoto[]) => void
}

export function ClinicalPhotoList({ consultationId, onPhotosChange }: ClinicalPhotoListProps) {
  const [photos, setPhotos] = useState<ClinicalPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  const supabase = createClient()

  useEffect(() => {
    loadPhotos()
  }, [consultationId])

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("clinical_photos")
        .select("*")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPhotos(data || [])
      onPhotosChange?.(data || [])

      // Generate signed URLs for preview
      const urls: Record<string, string> = {}
      for (const photo of data || []) {
        const { data: signedUrl } = await supabase.storage
          .from("clinical-photos")
          .createSignedUrl(photo.storage_path, 300) // 5 minutes

        if (signedUrl) {
          urls[photo.id] = signedUrl.signedUrl
        }
      }
      setPreviewUrls(urls)
    } catch (error) {
      console.error("Error loading photos:", error)
    } finally {
      setLoading(false)
    }
  }

  const deletePhoto = async (photo: ClinicalPhoto) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage.from("clinical-photos").remove([photo.storage_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase.from("clinical_photos").delete().eq("id", photo.id)

      if (dbError) throw dbError

      // Update local state
      const updatedPhotos = photos.filter((p) => p.id !== photo.id)
      setPhotos(updatedPhotos)
      onPhotosChange?.(updatedPhotos)

      // Remove preview URL
      setPreviewUrls((prev) => {
        const updated = { ...prev }
        delete updated[photo.id]
        return updated
      })
    } catch (error) {
      console.error("Error deleting photo:", error)
    }
  }

  const downloadPhoto = async (photo: ClinicalPhoto) => {
    try {
      const { data } = await supabase.storage.from("clinical-photos").download(photo.storage_path)

      if (data) {
        const url = URL.createObjectURL(data)
        const a = document.createElement("a")
        a.href = url
        a.download = `photo-${photo.created_at.split("T")[0]}.webp`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error downloading photo:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Photos cliniques</CardTitle>
          <CardDescription>Aucune photo n'a encore été ajoutée à cette consultation.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Photos cliniques
          <Badge variant="secondary">
            {photos.length} photo{photos.length > 1 ? "s" : ""}
          </Badge>
        </CardTitle>
        <CardDescription>Photos ajoutées à cette consultation. Cliquez sur une photo pour l'agrandir.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {previewUrls[photo.id] ? (
                  <img
                    src={previewUrls[photo.id] || "/placeholder.svg"}
                    alt="Photo clinique"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse bg-muted-foreground/20 w-full h-full"></div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => window.open(previewUrls[photo.id], "_blank")}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={() => downloadPhoto(photo)}>
                  <Download className="h-3 w-3" />
                </Button>
                <Button variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={() => deletePhoto(photo)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Photo Info */}
              <div className="mt-2 text-xs text-muted-foreground">
                <p>
                  {photo.width && photo.height && `${photo.width}×${photo.height}`}
                  {photo.file_size && ` • ${(photo.file_size / 1024 / 1024).toFixed(1)} MB`}
                </p>
                <p>{new Date(photo.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
