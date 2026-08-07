import React, { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Chip,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  Delete,
  CheckCircle,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface FileUploadProps {
  name: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onFileSelect?: (files: File[]) => void;
  onFileRemove?: (fileName: string) => void;
  value?: File[] | File | null;
  variant?: 'outlined' | 'filled' | 'standard';
  showPreview?: boolean;
}

// Styled DropZone with responsive enhancements
const DropZone = styled(Paper)<{ isDragOver: boolean; error: boolean }>(
  ({ theme, isDragOver, error }) => ({
    border: `2px dashed ${
      error
        ? theme.palette.error.main
        : isDragOver
        ? theme.palette.primary.main
        : theme.palette.grey[300]
    }`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(3),
    minHeight: 180,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: isDragOver
      ? theme.palette.action.hover
      : error
      ? theme.palette.error.light + '20'
      : theme.palette.background.default,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.main,
    },
  })
);

// Responsive FilePreview
const FilePreview = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  borderRadius: theme.spacing(0.5),
  border: `1px solid ${theme.palette.grey[200]}`,
  marginTop: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
}));

const CustomFileUpload: React.FC<FileUploadProps> = ({
  name,
  label,
  accept = '*',
  multiple = false,
  maxSize = 5,
  disabled = false,
  error = false,
  helperText,
  onFileSelect,
  onFileRemove,
  value,
  variant = 'outlined',
  showPreview = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploadComplete, setIsUploadComplete] = useState(false);

  const currentFiles = React.useMemo(() => {
    if (value) return Array.isArray(value) ? value : [value];
    return files;
  }, [value, files]);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    const validFiles = fileArray.filter((file) => file.size / (1024 * 1024) <= maxSize);

    if (validFiles.length !== fileArray.length) {
      console.warn(`Some files were rejected due to size limit (${maxSize}MB)`);
    }

    const newFiles = multiple ? [...currentFiles, ...validFiles] : validFiles;
    setFiles(newFiles);
    setIsUploadComplete(false); // Reset upload complete state
    onFileSelect?.(newFiles);

    if (validFiles.length > 0) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 100) {
            clearInterval(interval);
            setIsUploadComplete(true); // Mark upload as complete
            setTimeout(() => setUploadProgress(null), 500);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const handleFileRemove = (fileName: string) => {
    const updatedFiles = currentFiles.filter((file) => file.name !== fileName);
    setFiles(updatedFiles);
    setIsUploadComplete(updatedFiles.length > 0); // Keep upload complete if files remain
    onFileRemove?.(fileName);
    onFileSelect?.(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    return <InsertDriveFile color="primary" />;
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>

      {!isUploadComplete && (
        <DropZone
          isDragOver={isDragOver}
          error={error}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          elevation={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            name={name}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />

          <CloudUpload
            sx={{
              fontSize: 48,
              color: error ? 'error.main' : 'primary.main',
              opacity: disabled ? 0.5 : 1,
            }}
          />

          <Typography variant="h6" gutterBottom>
            {isDragOver ? 'Drop files here' : 'Choose files or drag & drop'}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Max size: {maxSize}MB {multiple && '• Multiple files allowed'}
          </Typography>

          <Box mt={2}>
            <Button
              variant="outlined"
              color="primary"
              disabled={disabled}
              startIcon={<CloudUpload />}
            >
              Browse Files
            </Button>
          </Box>
        </DropZone>
      )}

      {uploadProgress !== null && (
        <Box mt={2}>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {showPreview && currentFiles.length > 0 && (
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Selected Files:
          </Typography>
          <Stack spacing={1}>
            {currentFiles.map((file, index) => (
              <FilePreview key={`${file.name}-${index}`}>
                <Box sx={{ width: 40, height: 40, flexShrink: 0 }}>
                  {getFileIcon(file.name)}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  color="success"
                  icon={<CheckCircle />}
                  label="Ready"
                  sx={{ minWidth: 70 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleFileRemove(file.name)}
                  disabled={disabled}
                >
                  <Delete />
                </IconButton>
              </FilePreview>
            ))}
          </Stack>
        </Box>
      )}

      {helperText && (
        <Typography
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 1, display: 'block' }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default CustomFileUpload;