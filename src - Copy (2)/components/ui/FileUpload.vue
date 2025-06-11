<template>
  <div class="file-upload">
    <div class="upload-zone" :class="{ 
      'drag-over': isDragOver,
      'has-file': fileName,
      'loading': loading 
    }">
      <input 
        ref="fileInput"
        type="file" 
        :accept="accept"
        @change="handleFileSelect"
        class="file-input"
        :disabled="loading"
      />
      
      <div 
        class="upload-label"
        @click="openFileDialog"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
      >
        <div class="upload-content">
          <div class="upload-icon">
            <span v-if="loading">⏳</span>
            <span v-else-if="fileName">✅</span>
            <span v-else>📁</span>
          </div>
          
          <div class="upload-text">
            <h4 v-if="fileName">{{ fileName }}</h4>
            <h4 v-else-if="loading">Processing...</h4>
            <h4 v-else>Drop PDDL plan file here</h4>
            
            <p v-if="!fileName && !loading">
              or click to browse (.txt, .plan, .pddl)
            </p>
            <p v-else-if="fileName && !loading">
              Click to change file
            </p>
            <p v-else-if="loading">
              Reading file content...
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="error" class="upload-error">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error }}</span>
    </div>
    
    <div v-if="fileName && !loading" class="file-info">
      <div class="file-details">
        <span class="file-size">{{ formatFileSize(fileSize) }}</span>
        <span class="file-type">{{ getFileType(fileName) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'FileUpload',
  props: {
    accept: {
      type: String,
      default: '.txt,.plan,.pddl'
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['file-uploaded'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const fileName = ref('')
    const fileSize = ref(0)
    const isDragOver = ref(false)
    const error = ref('')
    
    const openFileDialog = () => {
      if (fileInput.value && !props.loading) {
        fileInput.value.click()
      }
    }
    
    const processFile = (file) => {
      if (!file) return
      
      // Reset error
      error.value = ''
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        error.value = 'File too large. Maximum size is 10MB.'
        return
      }
      
      // Validate file type
      const validExtensions = ['.txt', '.plan', '.pddl']
      const fileExt = '.' + file.name.split('.').pop().toLowerCase()
      if (!validExtensions.includes(fileExt)) {
        error.value = 'Invalid file type. Please select a .txt, .plan, or .pddl file.'
        return
      }
      
      fileName.value = file.name
      fileSize.value = file.size
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        
        // Basic validation of content
        if (!content || content.trim().length === 0) {
          error.value = 'File appears to be empty.'
          fileName.value = ''
          return
        }
        
        // Be very flexible with file validation - just check it's not empty
        if (!content || content.trim().length === 0) {
          error.value = 'File appears to be empty.'
          fileName.value = ''
          return
        }
        
        console.log('File content accepted. Length:', content.length)
        console.log('First 10 lines:', content.split('\n').slice(0, 10))
        
        emit('file-uploaded', {
          name: file.name,
          content: content,
          size: file.size,
          type: fileExt
        })
      }
      
      reader.onerror = () => {
        error.value = 'Failed to read file. Please try again.'
        fileName.value = ''
      }
      
      reader.readAsText(file)
    }
    
    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      processFile(file)
    }
    
    const handleDrop = (event) => {
      isDragOver.value = false
      const file = event.dataTransfer.files[0]
      processFile(file)
    }
    
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    const getFileType = (filename) => {
      const ext = filename.split('.').pop().toLowerCase()
      const types = {
        'txt': 'Text File',
        'plan': 'PDDL Plan',
        'pddl': 'PDDL Domain'
      }
      return types[ext] || 'Unknown'
    }
    
    return {
      fileInput,
      fileName,
      fileSize,
      isDragOver,
      error,
      openFileDialog,
      handleFileSelect,
      handleDrop,
      formatFileSize,
      getFileType
    }
  }
}
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.upload-zone {
  border: 2px dashed #bdc3c7;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  transition: all 0.3s ease;
  background: #fafafa;
  position: relative;
  cursor: pointer;
}

.upload-zone:hover {
  border-color: #3498db;
  background: #f0f8ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.upload-zone.drag-over {
  border-color: #3498db;
  background: #e3f2fd;
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
}

.upload-zone.has-file {
  border-color: #27ae60;
  background: #f0fff4;
}

.upload-zone.loading {
  border-color: #f39c12;
  background: #fff9e6;
  pointer-events: none;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  overflow: hidden;
  z-index: -1;
}

.upload-label {
  display: block;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 3rem;
  transition: transform 0.3s ease;
}

.upload-zone:hover .upload-icon {
  transform: scale(1.1);
}

.upload-text h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
}

.upload-text p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.95rem;
  line-height: 1.4;
}

.upload-error {
  margin-top: 12px;
  padding: 12px 15px;
  background: #fee;
  color: #e74c3c;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #fcc;
}

.error-icon {
  font-size: 1.1rem;
}

.error-text {
  flex: 1;
}

.file-info {
  margin-top: 12px;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.file-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #666;
}

.file-size {
  font-weight: 600;
}

.file-type {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Loading animation */
.upload-zone.loading .upload-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .upload-zone {
    padding: 20px 15px;
  }
  
  .upload-icon {
    font-size: 2.5rem;
  }
  
  .upload-text h4 {
    font-size: 1.1rem;
  }
  
  .upload-text p {
    font-size: 0.9rem;
  }
}
</style>