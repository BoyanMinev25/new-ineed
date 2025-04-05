import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

interface DeliveryFileUploaderProps {
  files: string[];
  onUpload: (files: string[]) => void;
}

const DeliveryFileUploader: React.FC<DeliveryFileUploaderProps> = ({ files, onUpload }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: string[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // In a real implementation, you would upload the file to your storage service
      // and get back a URL. For demo purposes, we'll create a fake URL
      newFiles.push(URL.createObjectURL(file));
    }
    onUpload([...files, ...newFiles]);
  };

  const handleDelete = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onUpload(newFiles);
  };

  return (
    <Paper 
      sx={{ 
        p: 3,
        border: '2px dashed',
        borderColor: dragActive ? 'primary.main' : 'divider',
        bgcolor: dragActive ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s ease-in-out'
      }}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Upload Delivery Files
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Drag and drop files here, or click to select files
        </Typography>
        <input
          type="file"
          multiple
          style={{ display: 'none' }}
          id="file-upload"
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
          >
            Select Files
          </Button>
        </label>
      </Box>

      {files.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Uploaded Files
          </Typography>
          
          <List>
            {files.map((file, index) => (
              <ListItem key={index}>
                <DescriptionIcon sx={{ mr: 1, color: 'action.active' }} />
                <ListItemText 
                  primary={file.split('/').pop()} 
                  secondary={`File ${index + 1}`}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDelete(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};

export default DeliveryFileUploader; 