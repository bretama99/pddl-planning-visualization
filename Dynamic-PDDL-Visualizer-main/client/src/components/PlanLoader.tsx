import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { usePlanStore } from '../store/planStore';

interface FileUploadZoneProps {
  title: string;
  description: string;
  accept: string;
  onFileSelect: (file: File) => Promise<void>;
  fileName?: string;
  isLoading?: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  title,
  description,
  accept,
  onFileSelect,
  fileName,
  isLoading
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await onFileSelect(files[0]);
    }
  }, [onFileSelect]);
  
  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onFileSelect(files[0]);
    }
  }, [onFileSelect]);
  
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-400 mb-1">{title}</label>
      <div
        className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : fileName 
              ? 'border-accent bg-accent/5' 
              : 'border-slate-600 hover:border-slate-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-input-${title}`)?.click()}
      >
        <input
          id={`file-input-${title}`}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={isLoading}
        />
        
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-1" />
            <p className="text-xs text-slate-500">Processing...</p>
          </>
        ) : (
          <>
            <FileText className="text-slate-500 text-lg mb-1 mx-auto" size={20} />
            <p className="text-xs text-slate-500">{description}</p>
            <p className={`text-xs mt-1 ${fileName ? 'text-accent' : 'text-slate-600'}`}>
              {fileName || 'No file selected'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export const PlanLoader: React.FC = () => {
  const {
    files,
    isLoading,
    loadingStatus,
    parseErrors,
    parseDomainFile,
    parseProblemFile,
    parsePlanFile,
    generateScene
  } = usePlanStore();
  
  const [domainFileName, setDomainFileName] = useState<string>('');
  const [problemFileName, setProblemFileName] = useState<string>('');
  const [planFileName, setPlanFileName] = useState<string>('');
  
  const handleDomainFile = useCallback(async (file: File) => {
    setDomainFileName(file.name);
    const content = await file.text();
    await parseDomainFile(content);
  }, [parseDomainFile]);
  
  const handleProblemFile = useCallback(async (file: File) => {
    setProblemFileName(file.name);
    const content = await file.text();
    await parseProblemFile(content);
  }, [parseProblemFile]);
  
  const handlePlanFile = useCallback(async (file: File) => {
    setPlanFileName(file.name);
    const content = await file.text();
    await parsePlanFile(content);
  }, [parsePlanFile]);
  
  const handleGenerateScene = useCallback(async () => {
    if (files.domain && files.problem && files.plan) {
      await generateScene();
    }
  }, [files, generateScene]);
  
  const canGenerateScene = files.domain && files.problem && files.plan && parseErrors.length === 0;
  const hasErrors = parseErrors.length > 0;
  
  return (
    <Card className="w-80 bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-200 flex items-center">
          <Upload className="mr-2 text-primary" size={16} />
          Load Planning Files
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Upload Zones */}
        <FileUploadZone
          title="PDDL Domain File"
          description="Drop domain.pddl or click to browse"
          accept=".pddl,.txt"
          onFileSelect={handleDomainFile}
          fileName={domainFileName}
          isLoading={isLoading && loadingStatus.includes('domain')}
        />
        
        <FileUploadZone
          title="PDDL Problem File"
          description="Drop problem.pddl or click to browse"
          accept=".pddl,.txt"
          onFileSelect={handleProblemFile}
          fileName={problemFileName}
          isLoading={isLoading && loadingStatus.includes('problem')}
        />
        
        <FileUploadZone
          title="LPG++ Plan File (.SOL)"
          description="Drop plan.sol or click to browse"
          accept=".sol,.txt"
          onFileSelect={handlePlanFile}
          fileName={planFileName}
          isLoading={isLoading && loadingStatus.includes('plan')}
        />
        
        {/* Loading Progress */}
        {isLoading && (
          <div className="space-y-2">
            <Progress value={75} className="w-full" />
            <p className="text-xs text-slate-400 text-center">{loadingStatus}</p>
          </div>
        )}
        
        {/* Parse Errors */}
        {hasErrors && (
          <Alert className="border-destructive bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Parse Errors:</strong>
              <ul className="mt-1 space-y-1">
                {parseErrors.map((error, index) => (
                  <li key={index} className="text-xs">• {error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Success Status */}
        {canGenerateScene && (
          <Alert className="border-accent bg-accent/10">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              All files loaded successfully. Ready to generate scene.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Generate Scene Button */}
        <Button
          onClick={handleGenerateScene}
          disabled={!canGenerateScene || isLoading}
          className="w-full bg-primary hover:bg-blue-700 text-white text-sm font-medium"
        >
          <Play className="mr-2" size={16} />
          Parse & Generate Scene
        </Button>
        
        {/* File Status Summary */}
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <h4 className="text-xs font-medium text-slate-300">Loaded Files:</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Domain:</span>
              <span className={files.domain ? 'text-accent' : 'text-slate-500'}>
                {files.domain ? '✓ Loaded' : 'Not loaded'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Problem:</span>
              <span className={files.problem ? 'text-accent' : 'text-slate-500'}>
                {files.problem ? '✓ Loaded' : 'Not loaded'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Plan:</span>
              <span className={files.plan ? 'text-accent' : 'text-slate-500'}>
                {files.plan ? '✓ Loaded' : 'Not loaded'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
