"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Camera, Upload, X, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { compressImage, validateImageFile, calculateSHA256 } from "@/lib/utils/image-compression"
import { createClient } from "@/lib/supabase/client"
import type { ClinicalPhoto } from "@/lib/types/medical"

interface ClinicalPhotoCaptureProps {
  consultationId: string
  onPhotosChange?: (photos: ClinicalPhoto[]) => void
}

interface PhotoFile {
  id: string
  file: File
  preview: string
  compressed?: Blob
  uploading: boolean
  uploaded: boolean
  error?: string
}

export function ClinicalPhotoCapture({ consultationId, onPhotosChange }: ClinicalPhotoCaptureProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [consentGiven, setConsentGiven] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const addError = (error: string) => {
    setErrors((prev) => [...prev, error])
    setTimeout(() => {
      setErrors((prev) => prev.filter((e) => e !== error))
    }, 5000)
  }

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const newPhotos: PhotoFile[] = []

      for (let i = 0; i < Math.min(files.length, 5 - photos.length); i++) {
        const file = files[i]
        const validation = validateImageFile(file)

        if (!validation.valid) {
          addError(validation.error || "Fichier invalide")
          continue
        }

        const id = crypto.randomUUID()
        const preview = URL.createObjectURL(file)

        newPhotos.push({
          id,
          file,
          preview,
          uploading: false,
          uploaded: false,
        })
      }

      if (newPhotos.length > 0) {
        setPhotos((prev) => [...prev, ...newPhotos])
        if (!consentGiven) {
          setShowConsent(true)
        }
      }
    },
    [photos.length, consentGiven],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileSelect(files)
      }
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const updated = prev.filter((photo) => photo.id !== id)
      const photo = prev.find((p) => p.id === id)
      if (photo) {
        URL.revokeObjectURL(photo.preview)
      }
      return updated
    })
  }

  const uploadPhoto = async (photo: PhotoFile) => {
    try {
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, uploading: true, error: undefined } : p)))

      // Compress image
      const compressed = await compressImage(photo.file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        format: "webp",
      })

      // Calculate SHA256
      const sha256 = await calculateSHA256(compressed)

      // Upload to Supabase Storage
      const fileName = `${consultationId}/${crypto.randomUUID()}.webp`
      const { error: uploadError } = await supabase.storage.from("clinical-photos").upload(fileName, compressed, {
        contentType: "image/webp",
        upsert: false,
      })

      if (uploadError) throw uploadError

      // Get image dimensions
      const img = new Image()
      img.src = photo.preview
      await new Promise((resolve) => {
        img.onload = resolve
      })

      // Save metadata to database
      const { error: dbError } = await supabase.from("clinical_photos").insert({
        consultation_id: consultationId,
        storage_path: fileName,
        mime_type: "image/webp",
        width: img.width,
        height: img.height,
        file_size: compressed.size,
        sha256,
      })

      if (dbError) throw dbError

      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, uploading: false, uploaded: true, compressed } : p)),
      )
    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'upload"
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, uploading: false, error: errorMessage } : p)))
      addError(errorMessage)
    }
  }

  const uploadAllPhotos = async () => {
    if (!consentGiven) {
      addError("Veuillez donner votre consentement avant de continuer")
      return
    }

    setIsUploading(true)
    const photosToUpload = photos.filter((p) => !p.uploaded && !p.uploading)

    try {
      await Promise.all(photosToUpload.map(uploadPhoto))
    } finally {
      setIsUploading(false)
    }
  }

  const handleConsentChange = (checked: boolean) => {
    setConsentGiven(checked)
    if (checked) {
      setShowConsent(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Consent Banner */}
      {showConsent && (
        <Alert className="border-accent bg-accent/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <p className="font-medium">Consentement pour l'envoi de photos médicales</p>
            <p className="text-sm text-muted-foreground">
              En cochant cette case, vous consentez à l'envoi de vos photos à notre système d'analyse IA pour obtenir un
              pré-diagnostic. Ces images seront traitées de manière sécurisée et confidentielle.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox id="consent" checked={consentGiven} onCheckedChange={handleConsentChange} />
              <label
                htmlFor="consent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                J'accepte l'envoi de mes photos médicales pour analyse
              </label>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Messages */}
      {errors.map((error, index) => (
        <Alert key={index} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ))}

      {/* Photo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos cliniques
          </CardTitle>
          <CardDescription>
            Ajoutez 1 à 5 photos de votre condition cutanée. Les images seront automatiquement compressées et
            sécurisées.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors cursor-pointer bg-muted/20"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Glissez vos photos ici</p>
            <p className="text-sm text-muted-foreground mb-4">ou cliquez pour sélectionner des fichiers</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Galerie
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  cameraInputRef.current?.click()
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Appareil photo
              </Button>
            </div>
          </div>

          {/* File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          />

          {/* Photo Preview Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={photo.preview || "/placeholder.svg"}
                      alt="Photo clinique"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    {photo.uploading && (
                      <Badge variant="secondary" className="text-xs">
                        Upload...
                      </Badge>
                    )}
                    {photo.uploaded && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Envoyé
                      </Badge>
                    )}
                    {photo.error && (
                      <Badge variant="destructive" className="text-xs">
                        Erreur
                      </Badge>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(photo.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* File Info */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="truncate">{photo.file.name}</p>
                    <p>{(photo.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {photos.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {photos.filter((p) => p.uploaded).length} / {photos.length} photos envoyées
              </p>
              <Button
                onClick={uploadAllPhotos}
                disabled={isUploading || !consentGiven || photos.every((p) => p.uploaded)}
                className="min-w-32"
              >
                {isUploading ? "Envoi en cours..." : "Envoyer les photos"}
              </Button>
            </div>
          )}

          {/* Guidelines */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p className="font-medium">Conseils pour de meilleures photos :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Éclairage naturel de préférence</li>
              <li>Photo nette et bien cadrée</li>
              <li>Évitez les reflets et les ombres</li>
              <li>Formats acceptés : JPEG, PNG, WebP (max 10MB)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
