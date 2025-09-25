'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Upload, 
  File, 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Code
} from 'lucide-react'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/utils'

// Função para obter ícone baseado no tipo de arquivo
const getFileIcon = (mimeType: string | null | undefined) => {
  // Verificar se mimeType existe e não é null/undefined
  if (!mimeType) {
    return <File className="w-5 h-5" />
  }
  
  if (mimeType.startsWith('image/')) {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <Image className="w-5 h-5" />
  } else if (mimeType.startsWith('video/')) {
    return <Video className="w-5 h-5" />
  } else if (mimeType.startsWith('audio/')) {
    return <Music className="w-5 h-5" />
  } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
    return <FileText className="w-5 h-5" />
  } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return <Archive className="w-5 h-5" />
  } else if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) {
    return <Code className="w-5 h-5" />
  } else {
    return <File className="w-5 h-5" />
  }
}

interface Attachment {
  id: string
  file_path: string
  original_filename: string
  file_size: number
  mime_type: string
  file_type: string
  description: string
  created_at: string
  uploaded_by: string
  users: {
    full_name: string
    email: string
  }
}

interface ProjectAttachmentsProps {
  projectId: string
}

export function ProjectAttachments({ projectId }: ProjectAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileDescriptions, setFileDescriptions] = useState<{[key: string]: string}>({})
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar anexos
  const loadAttachments = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data.attachments || [])
      } else {
        toast.error('Erro ao carregar anexos')
      }
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
      toast.error('Erro ao carregar anexos')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Carregar anexos na inicialização
  useEffect(() => {
    loadAttachments()
  }, [loadAttachments])

  // Upload de arquivo com descrição
  const uploadFile = useCallback(async (file: File, description: string) => {
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('description', description)

      const response = await fetch(`/api/projects/${projectId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setAttachments(prev => [data.attachment, ...prev])
        toast.success('Arquivo enviado com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao enviar arquivo')
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [projectId])

  // Deletar anexo
  const deleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAttachments(prev => prev.filter(att => att.id !== attachmentId))
        toast.success('Anexo removido com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao remover anexo')
      }
    } catch (error) {
      console.error('Erro ao deletar anexo:', error)
      toast.error('Erro ao remover anexo')
    }
  }

  // Download de anexo
  const downloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/attachments/${attachmentId}`)
      if (response.ok) {
        const data = await response.json()
        const link = document.createElement('a')
        link.href = data.attachment.download_url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast.error('Erro ao baixar arquivo')
      }
    } catch (error) {
      console.error('Erro no download:', error)
      toast.error('Erro ao baixar arquivo')
    }
  }

  // Configuração do dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles)
    const descriptions: {[key: string]: string} = {}
    acceptedFiles.forEach(file => {
      descriptions[file.name] = ''
    })
    setFileDescriptions(descriptions)
    setShowUploadDialog(true)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    noClick: true
  })

  // Processar upload dos arquivos selecionados
  const handleUploadFiles = async () => {
    for (const file of selectedFiles) {
      const description = fileDescriptions[file.name]
      if (!description || description.trim() === '') {
        toast.error(`Descrição é obrigatória para o arquivo: ${file.name}`)
        return
      }
      await uploadFile(file, description.trim())
    }
    setSelectedFiles([])
    setFileDescriptions({})
    setShowUploadDialog(false)
  }



  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Enviar Anexos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">
                Solte os arquivos aqui...
              </p>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Máximo 50MB por arquivo
                </p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Enviando arquivo...</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <div className="mt-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) {
                  setSelectedFiles(files)
                  const descriptions: {[key: string]: string} = {}
                  files.forEach(file => {
                    descriptions[file.name] = ''
                  })
                  setFileDescriptions(descriptions)
                  setShowUploadDialog(true)
                }
              }}
            />
          </div>

          {/* Diálogo de Upload com Descrição */}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Descrição aos Arquivos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm text-gray-500">({formatBytes(file.size)})</span>
                    </div>
                    <div>
                      <Label htmlFor={`description-${index}`}>Descrição *</Label>
                      <Input
                        id={`description-${index}`}
                        placeholder="Descreva o conteúdo ou propósito deste arquivo..."
                        value={fileDescriptions[file.name] || ''}
                        onChange={(e) => {
                          setFileDescriptions(prev => ({
                            ...prev,
                            [file.name]: e.target.value
                          }))
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadDialog(false)
                      setSelectedFiles([])
                      setFileDescriptions({})
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUploadFiles}
                    disabled={uploading || selectedFiles.some(file => !fileDescriptions[file.name]?.trim())}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Arquivos
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Lista de Anexos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <File className="w-5 h-5" />
              Anexos ({attachments.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Nenhum anexo encontrado</p>
              <p className="text-sm text-gray-400 mt-1">
                Envie arquivos usando a área de upload acima
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-gray-500">
                      {getFileIcon(attachment.mime_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {attachment.original_filename}
                      </p>
                      {attachment.description && (
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {attachment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{formatBytes(attachment.file_size)}</span>
                        <span>
                          Por {attachment.users?.full_name || attachment.users?.email || 'Usuário desconhecido'}
                        </span>
                        <span>
                          {new Date(attachment.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAttachment(attachment.id, attachment.original_filename)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteAttachment(attachment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
